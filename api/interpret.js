/** Optional Vercel serverless endpoint. Set GEMINI_API_KEY in Vercel only, never in frontend. */
export default async function handler(req,res){
 if(req.method!=='POST')return res.status(405).json({error:'method_not_allowed'});
 if(!process.env.GEMINI_API_KEY)return res.status(503).json({error:'ai_not_configured'});
 try{
  const {query,language}=req.body||{};
  if(typeof query!=='string'||query.length>500)return res.status(400).json({error:'invalid_query'});
  const model=process.env.GEMINI_MODEL||'gemini-2.5-flash';
  const prompt=`Interpret a user's WORD SEARCH filtering instruction (language ${String(language||'es').slice(0,5)}). Return ONLY compact JSON with these allowed fields: understood (boolean), contains (single letter or short substring), starts (substring), ends (substring), length (integer or null), direction (one of diagonal, horizontal, vertical, or empty string), category (one of animals, fruits, colors, food, nature, technology, places, or empty string), exact (word or empty string). Empty strings for unused fields. Never invent found words or grid contents. Instruction: ${JSON.stringify(query)}`;
  const result=await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`,{method:'POST',headers:{'Content-Type':'application/json','x-goog-api-key':process.env.GEMINI_API_KEY},body:JSON.stringify({contents:[{parts:[{text:prompt}]}],generationConfig:{responseMimeType:'application/json',temperature:0}})});
  if(!result.ok)return res.status(502).json({error:'ai_provider_error'});
  const data=await result.json();const raw=data?.candidates?.[0]?.content?.parts?.[0]?.text;const obj=JSON.parse(raw||'{}');
  const clean={understood:obj.understood===true,contains:String(obj.contains||'').slice(0,15).toUpperCase(),starts:String(obj.starts||'').slice(0,15).toUpperCase(),ends:String(obj.ends||'').slice(0,15).toUpperCase(),length:Number.isInteger(obj.length)&&obj.length>=3&&obj.length<=40?obj.length:null,direction:['diagonal','horizontal','vertical'].includes(obj.direction)?obj.direction:'',category:['animals','fruits','colors','food','nature','technology','places'].includes(obj.category)?obj.category:'',exact:String(obj.exact||'').slice(0,40).toUpperCase()};
  return res.status(200).json(clean);
 }catch{return res.status(500).json({error:'interpret_failed'});}
}
