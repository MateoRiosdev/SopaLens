import { test } from 'node:test';
import { strict as assert } from 'node:assert';
const listeners = new Map();
const elements = new Map([['app',{innerHTML:''}],['modal-root',{innerHTML:''}],['toast',{textContent:'',classList:{add(){},remove(){}}}]]);
globalThis.document={documentElement:{lang:''},body:{dataset:{}},addEventListener(type,callback){listeners.set(type,[...(listeners.get(type)||[]),callback])},getElementById(id){return elements.get(id)||null},querySelector(){return {content:''}}};
globalThis.window={addEventListener(){}};
globalThis.localStorage={getItem(){return null},setItem(){}};
await import('../js/app.js');
const html=()=>elements.get('app').innerHTML;
const modalHtml=()=>elements.get('modal-root').innerHTML;
function click(id,extra={}){const target={id,dataset:extra,closest(selector){if(selector==='button,[data-word],[data-suggest],[data-set-lang],[data-menu],[data-manual-cell],[data-generator-size],[data-generator-difficulty],[data-generator-dropdown]')return this;return null;}};for(const listener of listeners.get('click')||[])listener({target});}
function submit(value){const target={id:'search-form',querySelector(){return {value}}};for(const listener of listeners.get('submit')||[])listener({target,preventDefault(){}});}
function submitGenerator(words,size='12',difficulty='medium'){elements.set('generator-words',{value:words});click('',{generatorSize:size});click('',{generatorDifficulty:difficulty});const target={id:'generator-form'};for(const listener of listeners.get('submit')||[])listener({target,preventDefault(){}});}
test('initial demo shows six distinct words',()=>{
 assert.match(html(),/SopaLens/);
 assert.equal((html().match(/class="word-item /g)||[]).length,6);
 assert.equal((html().match(/>SOL</g)||[]).length,1);
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

test('single-letter search highlights every matching cell',()=>{
 submit('A');
 assert.match(html(),/search-hit/);
 assert.match(html(),/class=\"results-count\">[0-9]+ \/ [0-9]+/);
});
test('short sequence search traces exact letters',()=>{
 submit('BR');
 assert.match(html(),/class=\"word-item /);
 assert.match(html(),/>BR</);
});
test('grid editor shows editable cells and uploaded-image slot',()=>{
 click('edit-grid');
 assert.match(modalHtml(),/grid-cell-input/);
 assert.match(modalHtml(),/editor-image-section/);
 assert.match(modalHtml(),/word-chip-list/);
});
test('directions are translated with interface language',()=>{
 click('',{menu:'ui'});click('',{setLang:'ui:en'});
 assert.match(html(),/Diagonal/);
});
test('visual board can switch to direct letter-edit mode',()=>{
 click('toggle-board-edit');
 assert.match(html(),/board-cell-editor/);
});
test('letter search exposes a clear-filter action',()=>{
 submit('A');
 assert.match(html(),/id="clear-search"/);
 click('clear-search');
 assert.doesNotMatch(html(),/search-hit/);
});
test('phone help card is placed between steps and workspace and opens help',()=>{
 const markup=html();
 const steps=markup.indexOf('class="steps"');
 const mobileHelp=markup.indexOf('class="panel tip-panel mobile-tip-panel"');
 const workspace=markup.indexOf('class="workspace"');
 assert.ok(steps>=0&&mobileHelp>steps&&workspace>mobileHelp);
 assert.match(markup,/class="panel tip-panel desktop-tip-panel"/);
 click('help-link-mobile');
 assert.match(modalHtml(),/Tips|Consejos|Consigli|Tipps|Conseils|Tips voor/);
});

test('switching interface language also localizes demo puzzle and its word list',()=>{
 click('',{menu:'ui'});click('',{setLang:'ui:en'});
 assert.match(html(),/>HOUSE</);assert.match(html(),/>CAT</);assert.doesNotMatch(html(),/>CASA</);
 assert.match(html(),/Provided word list · English/);
});
test('preferences button is removed while language and theme controls remain',()=>{
 assert.doesNotMatch(html(),/id=\"settings-toggle\"/);
 assert.match(html(),/id=\"theme-toggle\"/);assert.match(html(),/data-menu=\"header-ui\"/);
});
test('create mode exposes the generator workflow',()=>{
 click('mode-create');
 assert.match(html(),/id=\"generator-form\"/);
 assert.match(html(),/id=\"generator-words\"/);
 assert.match(html(),/Generate word search/);
 submitGenerator('PLANET STAR GALAXY SATURN MARS','12','hard');
 assert.match(html(),/class=\"generated-board\"/);assert.match(html(),/>PLANET</);
 assert.match(html(),/Download without answers/);
 click('mode-solve');assert.match(html(),/id=\"search-form\"/);
});

test('all eight interface languages also use a matching demo vocabulary',()=>{
 const fixtures={es:['CASA','PERRO','LECHE'],en:['HOUSE','CAT','BREAD'],pt:['CASA','CAO','LEITE'],fr:['MAISON','CHIEN','SOLEIL'],de:['HAUS','KATZE','MILCH'],it:['CASA','CANE','LATTE'],nl:['HUIS','KAT','BROOD'],ca:['CASA','GOS','LLET']};
 for(const [code,words] of Object.entries(fixtures)){click('',{setLang:`ui:${code}`});for(const word of words)assert.match(html(),new RegExp(`>${word}<`),`${code} demo should include ${word}`);}
});
test('mobile action buttons are assigned equal grid columns in responsive CSS',async()=>{
 const {readFile}=await import('node:fs/promises');const css=await readFile(new URL('../styles.css',import.meta.url),'utf8');
 assert.match(css,/\.actions\s*\{display:grid;grid-template-columns:repeat\(2,minmax\(0,1fr\)\)/);
 assert.match(css,/\.actions #action-solution\{grid-column:1\/-1\}/);
});


test('manual letter marking works in solve and create modes',()=>{
 assert.match(html(),/data-manual-cell="0-0"/);
 click('',{manualCell:'0-0'});
 assert.match(html(),/manual-selected/);
 click('',{manualCell:'0-0'});
 assert.doesNotMatch(html(),/manual-selected/);
 click('mode-create');
 submitGenerator('PLANET STAR GALAXY','12','medium');
 assert.match(html(),/data-manual-cell="0-0"/);
 click('',{manualCell:'0-0'});
 assert.match(html(),/manual-selected/);
});

test('create mode title highlights its final word and generator result sits left of form',()=>{
 click('',{menu:'header-ui'});click('',{setLang:'ui:es'});
 click('mode-create');
 assert.match(html(),/Crea tu propio <span class="gradient">pupiletras<\/span>/);
 submitGenerator('PLANETA ESTRELLA GALAXIA','12','medium');
 assert.ok(html().indexOf('class="panel generated-result"') < html().indexOf('class="panel generator-panel generator-panel-compact"'));
 assert.match(html(),/scriptNote|chino, japonés/);
});

test('restore example appears before the hint and edit actions',()=>{
 click('mode-solve');
 assert.ok(html().indexOf('id="restore-demo"') < html().indexOf('class="board-bottom"'));
 assert.match(html(),/id="toggle-board-edit"/);
 assert.match(html(),/id="edit-grid"/);
});

test('responsive generator and mode buttons receive larger type and desktop two-column layout',async()=>{
 const {readFile}=await import('node:fs/promises');const css=await readFile(new URL('../styles.css',import.meta.url),'utf8');
 assert.match(css,/\.generator-workspace\{display:grid;grid-template-columns:minmax\(0,1fr\) minmax\(300px,360px\)/);
 assert.match(css,/\.mode-tab\{font-size:11\.5px/);
 assert.match(css,/\.generator-label\{text-align:center\}/);
});

test('create mode includes the same decorative mini-board as solve mode on desktop markup',()=>{
 click('mode-create');
 assert.match(html(),/class="hero-art"/);
 assert.match(html(),/class="mini-board"/);
});

test('generator size and difficulty use custom dropdown lists, not preset option cards',()=>{
 click('mode-create');
 assert.match(html(),/class="generator-select-trigger" data-generator-dropdown="size"/);
 assert.match(html(),/class="generator-select-trigger" data-generator-dropdown="difficulty"/);
 assert.doesNotMatch(html(),/class="size-option/);
 assert.doesNotMatch(html(),/class="difficulty-option/);
 assert.doesNotMatch(html(),/<select/);
 click('',{generatorDropdown:'size'});
 assert.match(html(),/id="generator-size-options" role="listbox"/);
 assert.match(html(),/data-generator-size="12"[^>]*aria-selected="true"/);
 click('',{generatorSize:'15'});
 assert.match(html(),/data-generator-dropdown="size" aria-haspopup="listbox" aria-expanded="false"/);
 assert.match(html(),/class="generator-select-value"><strong>15 × 15<\/strong>/);
 click('',{generatorDropdown:'difficulty'});
 assert.match(html(),/id="generator-difficulty-options" role="listbox"/);
 click('',{generatorDifficulty:'hard'});
 assert.match(html(),/class="generator-select-value"><strong>Difícil<\/strong>/);
 assert.match(html(),/data-generator-dropdown="difficulty" aria-haspopup="listbox" aria-expanded="false"/);
});

test('board helper and edit actions return to board area on mobile CSS only',async()=>{
 const {readFile}=await import('node:fs/promises');const css=await readFile(new URL('../styles.css',import.meta.url),'utf8');
 assert.match(css,/@media\(min-width:701px\)\{[\s\S]*?\.board-bottom\{display:grid/);
 assert.match(css,/@media\(max-width:700px\)\{[\s\S]*?\.upload-column\{display:contents\}[\s\S]*?\.board-bottom\{order:1;display:flex/);
});
