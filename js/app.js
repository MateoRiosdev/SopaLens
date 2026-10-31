import { LANGUAGES,t } from './languages.js';
import { parseGrid,findWords,normalized,parseIntent,filterMatches } from './solver.js';
import { getDictionary } from './dictionary.js';
import { recognizePuzzle } from './ocr.js';
const DEMO = `G C A S A R T B X
P E R R O K L M X
Z X S O L N P A X
A R B O L F C D X
P A N Q L E C H E
M Z Q V J C T R X
D F R U T A S N X
L K J H G N T P X`;
const DEMO_WORDS = 'CASA, PERRO, SOL, ÁRBOL, PAN, LECHE';
const COLORS=['#369efa','#fc6f92','#ffbc50','#37c899','#a778fd','#4cc9df','#ef8bc0','#ff9473','#7798e7','#a0c649'];
const safe=s=>String(s??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
const flag=code=>`<img class="round-flag" src="https://flagcdn.com/w80/${({es:'es',en:'us',pt:'br',fr:'fr',de:'de',it:'it',nl:'nl',ca:'es'})[code]||'es'}.png" alt="" loading="lazy"/>`;
const icon=name=>`<svg class="icon" aria-hidden="true"><use href="#i-${name}"></use></svg>`;
const getSetting=(k,def)=>{try{return localStorage.getItem(k)||def}catch{return def}};
const initialLang=getSetting('sopalens.uiLang','es');
const state={uiLang:LANGUAGES.some(l=>l.code===initialLang)?initialLang:'es',puzzleLang:'es',theme:getSetting('sopalens.theme','light'),grid:parseGrid(DEMO),gridRaw:DEMO,wordBank:DEMO_WORDS,found:[],visible:true,selectedId:'',query:'',intent:null,modal:'',openMenu:'',image:null,imageName:'',crop:{x:0,y:0,w:1,h:1},working:false,progress:0,mode:'demo',ocrRows:12,ocrCols:12,aiKey:getSetting('sopalens.geminiKey',''),ocrWarning:''};
let dragStart=null;let toastTimer;
const tt=key=>t(state.uiLang,key);
const locale=code=>LANGUAGES.find(l=>l.code===code)||LANGUAGES[0];
function notify(message){const el=document.getElementById('toast');el.textContent=message;el.classList.add('visible');clearTimeout(toastTimer);toastTimer=setTimeout(()=>el.classList.remove('visible'),3400)}
function wordCandidates(){
 const dictionary=getDictionary(state.puzzleLang);
 const bank=state.wordBank.trim().split(/[,;\n]+/).map(s=>normalized(s)).filter(w=>w.length>=3);
 return {words:bank.length?bank:dictionary.words,categories:dictionary.categories,explicit:bank.length>0};
}
function solve(){
 const {words,categories}=wordCandidates();
 state.found=state.grid.length?findWords(state.grid,words,categories):[];
 if(state.selectedId&&!state.found.some(w=>w.id===state.selectedId))state.selectedId='';
}
const matched=()=>{ const unique=new Map(); for(const word of filterMatches(state.found,state.intent)){if(!unique.has(word.word))unique.set(word.word,word);} return [...unique.values()]; }; 
const modeLine=()=>state.mode==='demo'?tt('modeDemo'):tt('modeImage');
function languagePicker(kind,scope="header"){
 const current=locale(kind==='ui'?state.uiLang:state.puzzleLang);
 return `<div class="dropdown-shell"><button class="dropdown-trigger" type="button" data-menu="${scope}-${kind}" aria-label="${safe(kind==='ui'?tt('language'):tt('dictionary'))}" aria-expanded="${state.openMenu===`${scope}-${kind}`}">${flag(current.code)}<span class="lang-name">${safe(current.name)}</span>${icon('chevron')}</button>${state.openMenu===`${scope}-${kind}`?`<div class="dropdown-menu" role="listbox">${LANGUAGES.map(x=>`<button type="button" role="option" class="${x.code===current.code?'active':''}" aria-selected="${x.code===current.code}" data-set-lang="${kind}:${x.code}">${flag(x.code)}${safe(x.name)}</button>`).join('')}</div>`:''}</div>`;
}
function boardHtml(){
 if(!state.grid.length)return `<div class="empty-board">${icon('grid')}<strong>${safe(tt('photoReady'))}</strong><span class="tiny">${safe(tt('cropHint'))}</span></div>`;
 const rows=state.grid.length,cols=state.grid[0].length, shown=matched();
 const strokes=state.visible?shown.map((w,index)=>{
  const first=w.cells[0],last=w.cells.at(-1),color=COLORS[state.found.indexOf(w)%COLORS.length];
  const active=state.selectedId===w.id;
  const opacity=state.selectedId&&!active?'.18':active?'.84':'.48';
  return `<line x1="${first.c+.5}" y1="${first.r+.5}" x2="${last.c+.5}" y2="${last.r+.5}" stroke="${color}" stroke-width=".74" opacity="${opacity}"/>`;
 }).join(''):'';
 return `<div class="board" style="--rows:${rows};--cols:${cols}" role="img" aria-label="${rows} × ${cols} ${safe(tt('grid'))}">
 ${state.grid.flat().map(x=>`<div class="cell">${safe(x)}</div>`).join('')}
 <svg class="board-ink" viewBox="0 0 ${cols} ${rows}" preserveAspectRatio="none" aria-hidden="true">${strokes}</svg></div>`;
}
function cropHtml(){if(!state.image)return `<label class="dropzone" id="dropzone" for="file-input" tabindex="0" role="button"><span class="drop-graphic">${icon('image')}</span><strong>${safe(tt('uploadHere'))}</strong><span>${safe(tt('formats'))}</span></label>`;
 const c=state.crop;
 return `<div class="image-stage" aria-label="${safe(tt('cropHint'))}"><img id="photo" draggable="false" src="${state.image}" alt="${safe(state.imageName)}"/><div class="crop-overlay" style="left:${c.x*100}%;top:${c.y*100}%;width:${c.w*100}%;height:${c.h*100}%"></div></div><div class="photo-label">${safe(state.imageName)}</div>`;
}
function appHtml(){const results=matched(),words=new Set(state.found.map(x=>x.word)).size,gridH=state.grid.length,gridW=state.grid[0]?.length||0;
 return `<div class="page">
 <header class="header"><a class="brand" href="#inicio" aria-label="SopaLens"><span class="brand-mark"><img src="./assets/logo_sopalens.jpg" alt=""/><svg viewBox="0 0 34 34" fill="none" hidden><rect x="4" y="4" width="10" height="10" rx="3" fill="white"/><rect x="19" y="4" width="10" height="10" rx="3" fill="white" opacity=".65"/><rect x="4" y="19" width="10" height="10" rx="3" fill="white" opacity=".65"/><circle cx="23" cy="23" r="6" stroke="white" stroke-width="3"/><path d="m28 28 4 4" stroke="white" stroke-width="3" stroke-linecap="round"/></svg></span><span><span class="brand-name"><b>Sopa</b><span>Lens</span></span><div class="brand-sub">${safe(({es:'Encuentra las LETRAS de la sopa',en:'Find the LETTERS in the puzzle',pt:'Encontre as LETRAS na sopa',fr:'Trouvez les LETTRES de la grille',de:'Finde die BUCHSTABEN im Suchrätsel',it:'Trova le LETTERE nella griglia',nl:'Vind de LETTERS in de puzzel',ca:'Troba les LLETRES de la sopa'})[state.uiLang])}</div></span></a>
 <div class="header-controls">${languagePicker('ui')}<button class="icon-btn" id="theme-toggle" title="${safe(tt('theme'))}" aria-label="${safe(tt('theme'))}">${icon(state.theme==='light'?'moon':'sun')}</button><button class="icon-btn" id="settings-toggle" title="${safe(tt('settings'))}" aria-label="${safe(tt('settings'))}">${icon('settings')}</button></div></header>
 <section class="hero" id="inicio"><div><span class="eyebrow">${icon('sparkle')}${safe(tt('eyebrow'))}</span><h1>${safe(tt('title').split(' ').slice(0,-1).join(' '))} <span class="gradient">${safe(tt('title').split(' ').at(-1))}</span></h1><p>${safe(tt('hero'))}</p></div><div class="hero-art" aria-hidden="true"><div class="mini-board">${['S','O','P','A','L','E','N','S','C','A','S','A'].map((c,i)=>`<i class="${[0,1,2,3,8,9,10,11].includes(i)?'active':''}">${c}</i>`).join('')}</div><div class="float-sparkle">${icon('sparkle')}</div><div class="float-sparkle sparkle2">${icon('sparkle')}</div></div></section>
  <section class="steps">${[1,2,3,4].map(n=>`<div class="panel step"><div class="step-n">0${n}</div><div><strong>${safe(tt(`step${n}`))}</strong><p>${safe(['OCR','8 directions','Smart search','Export'][n-1])}</p></div></div>`).join('')}</section>
 <div class="workspace"><main class="main-col"><section class="panel workspace-panel" aria-label="${safe(tt('workshop'))}"><div class="panel-head"><div class="section-kicker">${icon('grid')}${safe(tt('workshop'))}</div><span class="pill"><span class="dot"></span>${safe(modeLine())}</span></div>
 <div class="preview-grid"><div class="board-shell"><div class="board-toolbar"><strong>${safe(tt('stage'))}</strong><span class="board-dim">${gridH&&gridW?`${gridH} × ${gridW}`:'—'}</span></div>
 ${state.working?`<div class="processing">${icon('sparkle')}<strong>${safe(tt('analyzing'))}</strong><div class="progress-track"><div style="width:${state.progress}%" id="progress-fill"></div></div><span id="progress-label">${state.progress}%</span></div>`:boardHtml()}
 <div class="board-bottom"><span class="tiny">${safe(tt('boardHint'))}</span><button class="link-btn" id="edit-grid">${icon('edit')}${safe(tt('editGrid'))}</button></div></div>
 <aside class="upload-column"><div>${cropHtml()}${state.image?`<div class="tiny" style="margin-top:7px">${safe(tt('cropHint'))}</div>`:''}</div><div style="display:grid;gap:8px"><button class="btn btn-secondary full" id="upload-again">${icon('upload')}${safe(state.image?tt('change'):tt('upload'))}</button>${state.image?`<button class="btn btn-secondary full" id="open-crop">${icon('edit')}${state.uiLang==='es'?'Recortar imagen':'Crop image'}</button><button class="link-btn" id="reset-crop">${icon('refresh')}${safe(tt('resetCrop'))}</button>`:''}<button class="link-btn" id="restore-demo">${icon('refresh')}${safe(tt('tryDemo'))}</button></div></aside></div>
 <input id="file-input" type="file" accept="image/png,image/jpeg,image/webp" hidden/>
 <div class="actions"><button id="action-upload" class="btn btn-primary">${icon('upload')}${safe(tt('upload'))}</button><button id="action-analyze" ${state.working?'disabled':''} class="btn btn-purple">${icon('sparkle')}${safe(tt('analyze'))}</button><button id="action-solution" class="btn btn-ghost">${icon('download')}${safe(({es:'Imagen de respuestas',en:'Answer image',pt:'Imagem das respostas',fr:'Image des réponses',de:'Lösungsbild',it:'Immagine delle risposte',nl:'Antwoordafbeelding',ca:'Imatge de respostes'})[state.uiLang])}</button><button id="action-export" class="btn btn-secondary" ${!state.grid.length?'disabled':''} title="${safe(tt('download'))}">${icon('download')}</button></div></section>
 <section class="panel tip-panel"><img class="mascot" src="./assets/mascot.svg" alt="SopaLens robot"/><div><strong>${safe(tt('quick'))}</strong><p>${safe(tt('quickDesc'))}</p><button class="link-btn" id="help-link">${safe(tt('help'))} ${icon('arrow')}</button></div></section></main>
 <aside class="side-col"><section class="panel search-panel"><div class="search-top"><div class="search-badge">${icon('sparkle')}</div><div><div class="card-heading">${safe(tt('smart'))}</div><p class="card-caption">${safe(tt('smartDesc'))}</p></div></div>
 <form class="search-box" id="search-form">${icon('search')}<input id="query-input" value="${safe(state.query)}" autocomplete="off" aria-label="${safe(tt('smart'))}" placeholder="${safe(tt('queryPlaceholder'))}"/><button class="btn btn-purple" type="submit" aria-label="${safe(tt('go'))}">${icon('arrow')}</button></form>
 <div class="chips">${tt('suggestions').map((text,i)=>`<button class="chip" data-suggest="${i}" type="button">${safe(text)}</button>`).join('')}${state.intent?`<button class="chip" id="clear-search">× ${safe(tt('clear'))}</button>`:''}</div></section>
 <section class="panel results-panel"><div class="section-row"><div class="card-heading">${icon('check')}${safe(tt('results'))}</div><span class="results-count">${results.length} / ${words}</span></div><p class="card-caption">${safe(wordCandidates().explicit?tt('exact'):tt('auto'))} · ${safe(locale(state.puzzleLang).name)}</p>
 <div class="results-list" aria-live="polite">${results.length?results.map((item)=>{const col=COLORS[state.found.indexOf(item)%COLORS.length],first=item.cells[0];return `<button class="word-item ${state.selectedId===item.id?'active':''}" style="--word:${col}" data-word="${safe(item.id)}" type="button" aria-label="${safe(item.word)}"><span class="word-check">${icon('check')}</span><span><div class="word-name">${safe(item.word)}</div><div class="word-meta">${safe(tt('directions')?.[item.direction]||item.direction)} · ${first.r+1}:${first.c+1}</div></span><span class="word-end">›</span></button>`}).join(''):`<div class="no-results">${icon('search')}<strong>${safe(tt('none'))}</strong><div class="tiny">${safe(state.found.length?tt('noneHint'):tt('noWords'))}</div></div>`}</div>
 <div class="section-row" style="margin-top:13px"><button class="link-btn" id="edit-words">${icon('edit')}${safe(tt('wordBank'))}</button>${state.intent?`<button class="link-btn" id="show-all">${safe(tt('showAll'))}</button>`:''}</div></section>
</aside></div>
 <footer class="footer"><span>© 2026 <a href="https://www.linkedin.com/in/mateojuliogomerorios/" target="_blank" rel="noopener noreferrer">MateoRiosdev</a>. ${safe(tt('footer'))}</span></footer></div>`;
}
function modalHtml(){if(!state.modal)return '';
 const heading=state.modal==='crop'?(state.uiLang==='es'?'Recortar y preparar imagen':'Crop and prepare image'):state.modal==='edit'?tt('editTitle'):state.modal==='settings'?tt('settingsTitle'):tt('howTitle');
 return `<div class="modal-backdrop" id="backdrop"><div class="modal" role="dialog" aria-modal="true" aria-labelledby="modal-heading"><div class="modal-header"><h2 id="modal-heading">${safe(heading)}</h2><button class="icon-btn" id="close-modal" aria-label="${safe(tt('close'))}">${icon('x')}</button></div>
 ${state.modal==='crop'?`<p>${state.uiLang==='es'?'Arrastra sobre la imagen para seleccionar SOLO las letras de la cuadrícula. Evita los títulos y la lista de palabras. Indica cuántas filas y columnas tiene el pupiletras para mejorar el OCR.':'Drag on the image to select ONLY the letter grid, then specify its number of rows and columns.'}</p><div class="crop-modal-stage image-stage" id="crop-stage"><img src="${state.image}" draggable="false" alt="${safe(state.imageName)}"/><div class="crop-overlay" style="left:${state.crop.x*100}%;top:${state.crop.y*100}%;width:${state.crop.w*100}%;height:${state.crop.h*100}%"></div></div><div class="ocr-dimensions"><label>${state.uiLang==='es'?'Filas':'Rows'}<input id="ocr-rows" type="number" min="3" max="40" value="${state.ocrRows}"/></label><label>${state.uiLang==='es'?'Columnas':'Columns'}<input id="ocr-cols" type="number" min="3" max="40" value="${state.ocrCols}"/></label></div><p class="tiny">${state.uiLang==='es'?'Recomendado: contar las filas y columnas de la imagen antes de analizar.':'Count rows and columns before analysis.'}</p><div class="modal-actions"><button class="btn btn-ghost" id="crop-full">${state.uiLang==='es'?'Eliminar selección':'Clear selection'}</button><button class="btn btn-primary" id="save-crop">${safe(tt('save'))}</button></div>`:''}
 ${state.modal==='edit'?`<p>${safe(tt('editDesc'))}</p><h3>${safe(tt('grid'))}</h3><textarea class="grid-text" id="grid-editor" spellcheck="false" aria-label="${safe(tt('grid'))}" placeholder="${safe(tt('gridPlace'))}">${safe(state.gridRaw)}</textarea><h3>${safe(tt('wordBank'))}</h3><p>${safe(tt('wordBankHint'))}</p><textarea id="word-editor" spellcheck="false" aria-label="${safe(tt('wordBank'))}" placeholder="${safe(tt('wordBankPlace'))}">${safe(state.wordBank)}</textarea><div class="modal-actions"><button class="btn btn-ghost" id="close-cancel">${safe(tt('cancel'))}</button><button class="btn btn-primary" id="save-grid">${icon('check')}${safe(tt('save'))}</button></div>`:''}
 ${state.modal==='help'?`<p>${safe(tt('quickDesc'))}</p><ol class="modal-list"><li>${safe(tt('how1'))}</li><li>${safe(tt('how2'))}</li><li>${safe(tt('how3'))}</li></ol><p>${safe(tt('privacy'))}</p><div class="help-close-wrap"><button class="btn btn-primary" id="close-help">${safe(tt('close'))}</button></div>`:''}
 ${state.modal==='settings'?`<div class="setting-line"><div><strong>${safe(tt('language'))}</strong><small>${safe(tt('settings'))}</small></div>${languagePicker('ui','modal')}</div><div class="setting-line"><div><strong>${safe(tt('dictionary'))}</strong><small>${safe(tt('langHint'))}</small></div>${languagePicker('puzzle','modal')}</div><div class="setting-line"><strong>${safe(tt('theme'))}</strong><button class="icon-btn" id="modal-theme">${icon(state.theme==='light'?'moon':'sun')}</button></div><p class="privacy-note">${safe(tt('privacy'))}</p><div class="setting-line key-setting"><div><strong>Gemini API Key (BYOK)</strong><small>${state.uiLang==='es'?'Opcional. Tu clave se usa desde el navegador y se guarda solo en este navegador (localStorage), no en GitHub. Cualquier script de este sitio podría acceder a ella; usa una clave con cuotas restringidas y no la guardes en equipos compartidos.':'Optional. Your key is saved in this browser localStorage, not GitHub. Scripts on this site can access it; restrict its quota and avoid shared devices.'}</small></div><input id="gemini-key" type="password" autocomplete="off" value="${safe(state.aiKey)}" placeholder="AIza..." /></div><div class="modal-actions"><button class="btn btn-primary" id="close-help">${safe(tt('close'))}</button></div>`:''}
 </div></div>`;
}
function render(){document.documentElement.lang=state.uiLang;document.body.dataset.theme=state.theme;document.querySelector('meta[name="theme-color"]').content=state.theme==='dark'?'#0b1022':'#f3f6ff';document.getElementById('app').innerHTML=appHtml();document.getElementById('modal-root').innerHTML=modalHtml();}
function restoreDemo(){state.image&&URL.revokeObjectURL(state.image);state.image=null;state.mode='demo';state.crop={x:0,y:0,w:1,h:1};state.gridRaw=DEMO;state.grid=parseGrid(DEMO);state.wordBank=DEMO_WORDS;state.puzzleLang='es';state.query='';state.intent=null;state.visible=true;state.selectedId='';solve();render();}
function setImage(file){if(!file)return;
 if(!['image/jpeg','image/png','image/webp'].includes(file.type)||file.size>12*1024*1024){notify(tt('failedFile'));return;}
 if(state.image)URL.revokeObjectURL(state.image);
 state.image=URL.createObjectURL(file);state.imageName=file.name;state.crop={x:0,y:0,w:1,h:1};state.grid=[];state.gridRaw='';state.wordBank='';state.found=[];state.ocrWarning='';state.query='';state.intent=null;state.mode='image';state.selectedId='';state.visible=true;state.modal='crop';render();notify(tt('photoReady'));
}
async function analyze(){if(state.working)return;
 if(!state.image){notify(tt('imageFirst'));document.getElementById('file-input')?.click();return;}
 state.working=true;state.progress=0;render();
 try{const {gridText}=await recognizePuzzle(state.image,state.crop,locale(state.puzzleLang).ocr,value=>{
  state.progress=value;const f=document.getElementById('progress-fill'),l=document.getElementById('progress-label');if(f)f.style.width=value+'%';if(l)l.textContent=value+'%';},{rows:state.ocrRows,cols:state.ocrCols});
  state.gridRaw=gridText;state.grid=parseGrid(gridText);state.ocrWarning=gridText.includes(' X ')?'Review uncertain OCR cells in the grid editor.':'';if(!state.grid.length)throw new Error('grid-empty');state.query='';state.intent=null;state.selectedId='';solve();notify(tt('doneOCR'));
 }catch(error){console.error('SopaLens OCR:',error);notify(state.uiLang==='es'?'No se pudo leer la cuadrícula con precisión. Revisa el recorte o edita las letras.':'OCR failed. Review the crop or edit the grid.');state.modal='crop';}
 finally{state.working=false;render()}
}
async function applySearch(query){state.query=query.trim();if(!state.query){state.intent=null;state.selectedId='';render();return;}
 let intent=parseIntent(state.query);
 if(!intent.understood){const exact=state.found.find(x=>x.word===normalized(query));if(exact){intent.exact=exact.word;intent.understood=true;}}
 if(!intent.understood){try{
  const controller=new AbortController();const timeout=setTimeout(()=>controller.abort(),5000);
  try {const endpoint=state.aiKey?'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent':'/api/interpret';const res=await fetch(endpoint,{method:'POST',headers:{'Content-Type':'application/json',...(state.aiKey?{'x-goog-api-key':state.aiKey}:{})},body:JSON.stringify(state.aiKey?{contents:[{parts:[{text:'Interpret a word-search filtering instruction. Return only JSON containing understood boolean, contains, starts, ends, length, direction (diagonal/horizontal/vertical), category (animals/fruits/colors/food/nature/technology/places), exact. Do not invent grid words. Instruction: '+state.query}]}],generationConfig:{responseMimeType:'application/json',temperature:0}}:{query:state.query,language:state.uiLang}),signal:controller.signal});if(res.ok){const response=await res.json();const data=state.aiKey?JSON.parse(response?.candidates?.[0]?.content?.parts?.[0]?.text||'{}'):response;if(data&&data.understood)intent={...intent,...data,understood:true};}}
  finally{clearTimeout(timeout)}
 }catch{/* Optional remote AI is absent; offline filters still work. */}}
 if(!intent.understood){notify(tt('queryUnknown'));state.intent=null;render();return;}
 state.intent=intent;state.selectedId='';state.visible=true;render();}
function exportPng(){if(!state.grid.length)return;
 const size=70,pad=42,cols=state.grid[0].length,rows=state.grid.length;
 const canvas=document.createElement('canvas');canvas.width=cols*size+pad*2;canvas.height=rows*size+pad*2+60;
 const ctx=canvas.getContext('2d');ctx.fillStyle='#ffffff';ctx.fillRect(0,0,canvas.width,canvas.height);
 ctx.fillStyle='#172044';ctx.font='800 28px sans-serif';ctx.fillText('SopaLens',pad,37);
 ctx.fillStyle='#f6f8fd';ctx.fillRect(pad,pad+17,cols*size,rows*size);
 ctx.strokeStyle='#dfe6f3';ctx.lineWidth=1;
 for(let r=0;r<=rows;r++){ctx.beginPath();ctx.moveTo(pad,pad+17+r*size);ctx.lineTo(pad+cols*size,pad+17+r*size);ctx.stroke();}
 for(let c=0;c<=cols;c++){ctx.beginPath();ctx.moveTo(pad+c*size,pad+17);ctx.lineTo(pad+c*size,pad+17+rows*size);ctx.stroke();}
 if(state.visible)matched().forEach(w=>{const a=w.cells[0],b=w.cells.at(-1);ctx.beginPath();ctx.moveTo(pad+(a.c+.5)*size,pad+17+(a.r+.5)*size);ctx.lineTo(pad+(b.c+.5)*size,pad+17+(b.r+.5)*size);ctx.lineCap='round';ctx.lineWidth=size*.72;ctx.strokeStyle=COLORS[state.found.indexOf(w)%COLORS.length]+'80';ctx.stroke();});
 ctx.fillStyle='#101c38';ctx.font='800 31px sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';
 state.grid.forEach((row,r)=>row.forEach((letter,c)=>ctx.fillText(letter,pad+(c+.5)*size,pad+17+(r+.5)*size)));
 ctx.textAlign='left';ctx.font='14px sans-serif';ctx.fillStyle='#68738d';ctx.fillText('sopalens · '+matched().length+' '+tt('statsWords'),pad,canvas.height-13);
 canvas.toBlob(blob=>{if(!blob)return;const url=URL.createObjectURL(blob);const a=document.createElement('a');a.download='SopaLens-solucion.png';a.href=url;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);notify(tt('exported'));},'image/png');
}
function pointerPos(e,rect){return {x:Math.min(1,Math.max(0,(e.clientX-rect.left)/rect.width)),y:Math.min(1,Math.max(0,(e.clientY-rect.top)/rect.height))}}
function handleCropStart(e){if(e.button!==0)return;const stage=e.target.closest('#crop-stage');if(!stage)return;dragStart={start:pointerPos(e,stage.getBoundingClientRect()),id:e.pointerId};stage.setPointerCapture?.(e.pointerId);}
function handleCropMove(e){if(!dragStart)return;const stage=e.target.closest('#crop-stage')||document.getElementById('crop-stage');if(!stage)return;const point=pointerPos(e,stage.getBoundingClientRect()),start=dragStart.start;
 const x=Math.min(point.x,start.x),y=Math.min(point.y,start.y),w=Math.abs(point.x-start.x),h=Math.abs(point.y-start.y);
 const overlay=stage.querySelector('.crop-overlay');if(overlay){overlay.style.left=x*100+'%';overlay.style.top=y*100+'%';overlay.style.width=w*100+'%';overlay.style.height=h*100+'%';}
}
function handleCropEnd(e){if(!dragStart)return;const stage=e.target.closest('#crop-stage')||document.getElementById('crop-stage');if(!stage)return;const end=pointerPos(e,stage.getBoundingClientRect()),start=dragStart.start;
 const x=Math.min(start.x,end.x),y=Math.min(start.y,end.y),w=Math.abs(start.x-end.x),h=Math.abs(start.y-end.y);
 if(w>.08&&h>.08)state.crop={x,y,w,h};dragStart=null;render();}
function toggleTheme(){state.theme=state.theme==='dark'?'light':'dark';try{localStorage.setItem('sopalens.theme',state.theme)}catch{}render();}
function setLang(kind,code){if(!LANGUAGES.some(l=>l.code===code))return;
 if(kind==='ui'){state.uiLang=code;try{localStorage.setItem('sopalens.uiLang',code)}catch{}}
 if(kind==='puzzle'){state.puzzleLang=code;solve();}state.openMenu='';render();}
function handleClick(e){const target=e.target.closest('button,[data-word],[data-suggest],[data-set-lang],[data-menu]');
 if(!target){if(state.openMenu&&!e.target.closest('.dropdown-shell')){state.openMenu='';render()}return;}
 const {id,dataset}=target;
 if(dataset.menu){state.openMenu=state.openMenu===dataset.menu?'':dataset.menu;render();return;}
 if(dataset.setLang){const [kind,code]=dataset.setLang.split(':');setLang(kind,code);return;}
 if(dataset.word){state.selectedId=state.selectedId===dataset.word?'':dataset.word;state.visible=true;render();return;}
 if(dataset.suggest!==undefined){const index=Number(dataset.suggest);const prompts=state.uiLang==='es'?['Encuentra palabras con la letra C','Encuentra animales','Encuentra palabras en diagonal','Encuentra palabras de 5 letras']:
 state.uiLang==='en'?['Find words with the letter C','Find animals','Find words in diagonal','Find words of 5 letters']:
 [tt('suggestions')[0],tt('suggestions')[1],tt('suggestions')[2],tt('suggestions')[3]];
 applySearch(prompts[index]);return;}
 switch(id){case 'theme-toggle':case 'modal-theme':toggleTheme();break;
 case 'settings-toggle':state.modal='settings';state.openMenu='';render();break;
 case 'open-crop':state.modal='crop';state.openMenu='';render();break;
 case 'crop-full':state.crop={x:0,y:0,w:1,h:1};render();break;
 case 'save-crop':state.ocrRows=Math.min(40,Math.max(3,Number(document.getElementById('ocr-rows')?.value)||12));state.ocrCols=Math.min(40,Math.max(3,Number(document.getElementById('ocr-cols')?.value)||12));state.modal='';render();break;
 case 'edit-grid':case 'edit-words':state.modal='edit';render();break;
 case 'close-modal':case 'close-cancel':case 'close-help':state.modal='';state.openMenu='';render();break;
 case 'save-grid':try{const gridRaw=document.getElementById('grid-editor').value,bank=document.getElementById('word-editor').value;const grid=parseGrid(gridRaw);state.grid=grid;state.gridRaw=gridRaw;state.wordBank=bank;state.modal='';state.query='';state.intent=null;state.selectedId='';state.visible=true;solve();render();}catch{notify(tt('invalidGrid'))}break;
 case 'help-link':state.modal='help';render();break;
 case 'action-upload':case 'upload-again':document.getElementById('file-input')?.click();break;
 case 'action-analyze':analyze();break;
 case 'action-solution':exportPng();break;
 case 'action-export':exportPng();break;
 case 'reset-crop':state.crop={x:0,y:0,w:1,h:1};state.grid=[];state.gridRaw='';state.found=[];state.selectedId='';state.modal='crop';render();break;
 case 'restore-demo':restoreDemo();break;
 case 'clear-search':case 'show-all':state.query='';state.intent=null;state.selectedId='';render();break;
 }
}
document.addEventListener('click',handleClick);
document.addEventListener('submit',e=>{if(e.target.id==='search-form'){e.preventDefault();applySearch(e.target.querySelector('input').value);}});
document.addEventListener('input',e=>{if(e.target.id==='gemini-key'){state.aiKey=e.target.value;try{localStorage.setItem('sopalens.geminiKey',state.aiKey)}catch{}}});
document.addEventListener('change',e=>{if(e.target.id==='file-input'){setImage(e.target.files?.[0]);e.target.value='';}});
document.addEventListener('pointerdown',e=>{const stage=e.target.closest('#crop-stage');if(stage)handleCropStart(e)});
document.addEventListener('pointermove',e=>{const stage=e.target.closest('#crop-stage')|| (dragStart&&document.getElementById('crop-stage'));if(stage)handleCropMove(e)});
document.addEventListener('pointerup',e=>{const stage=e.target.closest('#crop-stage')|| (dragStart&&document.getElementById('crop-stage'));if(stage)handleCropEnd(e)});
document.addEventListener('dragover',e=>{if(e.target.closest('#dropzone')){e.preventDefault();e.target.closest('#dropzone').classList.add('dragging')}});
document.addEventListener('dragleave',e=>{e.target.closest('#dropzone')?.classList.remove('dragging')});
document.addEventListener('drop',e=>{if(e.target.closest('#dropzone')){e.preventDefault();setImage(e.dataTransfer?.files?.[0]);}});
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&(state.modal||state.openMenu)){state.modal='';state.openMenu='';render()}if((e.key==='Enter'||e.key===' ')&&e.target.id==='dropzone'){e.preventDefault();document.getElementById('file-input')?.click()}});
document.addEventListener('click',e=>{if(e.target.id==='backdrop'){state.modal='';state.openMenu='';render()}});
window.addEventListener('paste',e=>{if(e.target.matches('textarea,input'))return;const file=Array.from(e.clipboardData?.files||[]).find(x=>x.type.startsWith('image/'));if(file)setImage(file)});
solve();render();
