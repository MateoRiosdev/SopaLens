import { test } from 'node:test';
import { strict as assert } from 'node:assert';
import { parseGrid, findWords, parseIntent, filterMatches, extractGridText } from '../js/solver.js';
const grid = parseGrid(`G C A S A R T B X
P E R R O K L M X
Z X S O L N P A X
A R B O L F C D X
P A N Q L E C H E
M Z Q V J C T R X
D F R U T A S N X
L K J H G N T P X`);
test('rectangular unicode grid parsed',()=>assert.equal(grid[0].length,9));
test('find six real matches with coordinates and multiple directions',()=>{
 const found = findWords(grid,['CASA','PERRO','SOL','ARBOL','PAN','LECHE']);
 assert.deepEqual([...new Set(found.map(w=>w.word))].sort(), ['ARBOL','CASA','LECHE','PAN','PERRO','SOL']);
 assert.equal(found.find(x=>x.word==='CASA').cells[0].c,1);
});
test('filters C letters from actual matches only',()=>{
 const found = findWords(grid,['CASA','PERRO','SOL','ARBOL','PAN','LECHE']);
 const results = filterMatches(found,parseIntent('Encuentra palabras que tengan c'));
 assert.deepEqual(results.map(x=>x.word),['CASA','LECHE']);
});
test('filters orientation and length',()=>{
 const found = findWords(grid,['CASA','PERRO','SOL','ARBOL','PAN','LECHE']);
 assert.deepEqual([...new Set(filterMatches(found,parseIntent('encuentra palabras de 3 letras')).map(x=>x.word))].sort(), ['PAN','SOL']);
 assert.ok(filterMatches(found,parseIntent('palabras en diagonal')).every(w=>w.direction.includes('-')));
});
test('rejects malformed grids',()=>assert.throws(()=>parseGrid('A B C\nA B\nC D E')));
test('supports accented letters',()=>{
 const g=parseGrid('C A F É\nO L A S\nS A L T\nA R B O');
 assert.ok(findWords(g,['CAFÉ']).some(w=>w.word==='CAFE'));
});
test('extracts block when OCR has title and footer',()=>{
 const value=extractGridText('SOPA DE LETRAS\nC A S A\nO P I O\nL U N A\nFIN');
 assert.ok(value.includes('C A S A'));
});

test('finds words along all eight directions',()=>{
 const g=Array.from({length:5},()=>Array(5).fill('X'));
 g[2][2]='C';
 for(const [dr,dc] of [[0,1],[0,-1],[1,0],[-1,0],[1,1],[1,-1],[-1,1],[-1,-1]]){
  g[2+dr][2+dc]='A';g[2+dr*2][2+dc*2]='T';
 }
 const found=findWords(g,['CAT']);
 assert.equal(new Set(found.map(x=>x.direction)).size,8);
});
test('filters Ñ without confusing it with N',()=>{
 const g=parseGrid('Ñ A N D\nX X X X\nX X X X\nX X X X');
 const found=findWords(g,['ÑAN','NAN']);
 assert.deepEqual(filterMatches(found,parseIntent('con la letra ñ')).map(x=>x.word),['ÑAN']);
});
test('length filter is not mistaken for letter S',()=>{
 const i=parseIntent('Encuentra palabras de 5 letras');
 assert.equal(i.length,5); assert.equal(i.contains,'');
});
