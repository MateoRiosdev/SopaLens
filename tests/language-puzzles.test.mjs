import { test } from 'node:test';
import { strict as assert } from 'node:assert';
import { parseGrid, findWords } from '../js/solver.js';

test('Portuguese sample puzzle finds all 12 provided words including accents',()=>{
 const grid=parseGrid(`A R V O R E R U A
C P A O L E I T E
S O L G A T O F X
M Z B A G U A K X
Q W V R L E A O X
C A S A A J T P X
P A R Q U E M N X
C A R R O B S Z X`);
 const words=['COBRA','GATO','LEÃO','ÁRVORE','RUA','PÃO','LEITE','SOL','ÁGUA','CASA','PARQUE','CARRO'];
 const found=findWords(grid,words,{});
 assert.equal(new Set(found.map(item=>item.word)).size,12);
});
