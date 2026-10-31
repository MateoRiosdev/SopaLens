import { test } from 'node:test';
import { strict as assert } from 'node:assert';
const listeners = new Map();
const elements = new Map([['app',{innerHTML:''}],['modal-root',{innerHTML:''}],['toast',{textContent:'',classList:{add(){},remove(){}}}]]);
globalThis.document={documentElement:{lang:''},body:{dataset:{}},addEventListener(type,callback){listeners.set(type,[...(listeners.get(type)||[]),callback])},getElementById(id){return elements.get(id)||null},querySelector(){return {content:''}}};
globalThis.window={addEventListener(){}};
globalThis.localStorage={getItem(){return null},setItem(){}};
await import('../js/app.js');
const html=()=>elements.get('app').innerHTML;
function click(id,extra={}){const target={id,dataset:extra,closest(selector){if(selector==='button,[data-word],[data-suggest],[data-set-lang],[data-menu]')return this;return null;}};for(const listener of listeners.get('click')||[])listener({target});}
function submit(value){const target={id:'search-form',querySelector(){return {value}}};for(const listener of listeners.get('submit')||[])listener({target,preventDefault(){}});}
test('initial demo shows six distinct words',()=>{
 assert.match(html(),/SopaLens/);
 assert.equal((html().match(/class="word-item /g)||[]).length,6);
});
test('searching letter C only shows CASA and LECHE',()=>{
 submit('Encuentra palabras que tengan C');
 assert.equal((html().match(/class="word-item /g)||[]).length,2);
 assert.match(html(),/>CASA</);assert.match(html(),/>LECHE</);
});
test('reset search then theme and interface language',()=>{
 click('show-all');click('theme-toggle');
 assert.equal(document.body.dataset.theme,'dark');
 click('',{menu:'ui'});click('',{setLang:'ui:en'});
 assert.match(html(),/Find every hidden/);
 assert.equal(document.documentElement.lang,'en');
});
