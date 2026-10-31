import { extractGridText } from './solver.js';
let loader;
async function tesseract() {
  if (globalThis.Tesseract?.createWorker) return globalThis.Tesseract;
  loader ||= new Promise((resolve,reject)=>{
    const script=document.createElement('script');
    script.src='https://cdn.jsdelivr.net/npm/tesseract.js@7.0.0/dist/tesseract.min.js';
    script.crossOrigin='anonymous';script.onload=()=>resolve(globalThis.Tesseract);
    script.onerror=()=>reject(new Error('ocr-download'));
    document.head.append(script);
  });
  return loader;
}
/** Crop is expressed as fractions of original image dimensions. */
async function toCanvas(image, crop) {
  const img=new Image();img.src=image;
  await img.decode();
  const x=Math.round(crop.x*img.naturalWidth),y=Math.round(crop.y*img.naturalHeight);
  const w=Math.max(1,Math.round(crop.w*img.naturalWidth)),h=Math.max(1,Math.round(crop.h*img.naturalHeight));
  const scale=Math.min(3,Math.max(1,1100/Math.max(w,h)));
  const canvas=document.createElement('canvas');canvas.width=Math.round(w*scale);canvas.height=Math.round(h*scale);
  const ctx=canvas.getContext('2d',{willReadFrequently:true});
  ctx.fillStyle='#fff';ctx.fillRect(0,0,canvas.width,canvas.height);
  ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality='high';
  ctx.drawImage(img,x,y,w,h,0,0,canvas.width,canvas.height);
  const pixels=ctx.getImageData(0,0,canvas.width,canvas.height);
  for(let i=0;i<pixels.data.length;i+=4){
    const v=pixels.data[i]*.299+pixels.data[i+1]*.587+pixels.data[i+2]*.114;
    const boosted=Math.max(0,Math.min(255,(v-128)*1.24+137));
    pixels.data[i]=pixels.data[i+1]=pixels.data[i+2]=boosted;
  }
  ctx.putImageData(pixels,0,0);
  return canvas;
}
export async function recognizePuzzle(image,crop,ocrLang,progress=()=>{},dimensions=null) {
  const T=await tesseract();
  const worker=await T.createWorker(ocrLang,1,{logger:msg=>{
    if(msg.status==='recognizing text')progress(Math.round((msg.progress||0)*100));
  }});
  try {
    await worker.setParameters({tessedit_pageseg_mode:T.PSM.SINGLE_BLOCK,
      tessedit_char_whitelist:'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyzÑñÇçÀÁÂÃÄÅàáâãäåÉÈÊËéèêëÍÌÎÏíìîïÓÒÔÕÖóòôõöÚÙÛÜúùûüÝýßÆæŒœ',
      preserve_interword_spaces:'1'});
    const canvas=await toCanvas(image,crop);
    // Row-guided recognition preserves grid dimensions and prevents a 3 x 34 board.
    if (dimensions?.rows >= 3 && dimensions?.cols >= 3) {
      const rows=dimensions.rows,cols=dimensions.cols;
      if(rows>40 || cols>40)throw new Error('dimensions-too-large');
      await worker.setParameters({tessedit_pageseg_mode:T.PSM.SINGLE_LINE});
      const result=[];
      for(let r=0;r<rows;r++){
        const c=document.createElement('canvas');
        const rowH=canvas.height/rows;
        const pad=Math.max(7,Math.round(rowH*.25));
        c.width=canvas.width+pad*2;c.height=Math.max(20,Math.round(rowH+pad*2));
        const ctx=c.getContext('2d');ctx.fillStyle='#fff';ctx.fillRect(0,0,c.width,c.height);
        ctx.drawImage(canvas,0,r*rowH,canvas.width,rowH,pad,pad,canvas.width,rowH);
        const response=await worker.recognize(c);
        const letters=String(response?.data?.text||'').toUpperCase().normalize('NFC').match(/[A-ZÑÇÀÁÂÃÄÅÉÈÊËÍÌÎÏÓÒÔÕÖÚÙÛÜÝÆŒ]/gu)||[];
        if(letters.length===cols){result.push(letters.join(' '));}
        else {
          // OCR each cell independently when line recognition merges or skips characters.
          const recovered=[];
          await worker.setParameters({tessedit_pageseg_mode:T.PSM.SINGLE_CHAR});
          for(let col=0;col<cols;col++){
            const cw=canvas.width/cols,ch=canvas.height/rows;
            const tile=document.createElement('canvas');const size=96;tile.width=size;tile.height=size;
            const tc=tile.getContext('2d');tc.fillStyle='#fff';tc.fillRect(0,0,size,size);
            const padding=Math.round(size*.13);
            tc.drawImage(canvas,col*cw,r*ch,cw,ch,padding,padding,size-2*padding,size-2*padding);
            const rr=await worker.recognize(tile);
            const match=String(rr?.data?.text||'').normalize('NFC').toUpperCase().match(/[A-ZÑÇÀÁÂÃÄÅÉÈÊËÍÌÎÏÓÒÔÕÖÚÙÛÜÝÆŒ]/u);
            recovered.push(match?.[0]||'X');
          }
          result.push(recovered.join(' '));
          await worker.setParameters({tessedit_pageseg_mode:T.PSM.SINGLE_LINE});
        }
        progress(Math.round((r+1)/rows*100));
      }
      return {raw:result.join('\n'),gridText:result.join('\n')};
    }
    const res=await worker.recognize(canvas);
    const raw=res?.data?.text || '';
    return {raw,gridText:extractGridText(raw)};
  } finally {await worker.terminate();}
}
