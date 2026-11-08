import { test } from 'node:test';
import { strict as assert } from 'node:assert';
import { generateWordSearch } from '../js/generator.js';
import { findWords, graphemes, normalized, parseGrid } from '../js/solver.js';

test('generator creates a rectangular grid and places every fitting word', () => {
  const words = ['PLANETA', 'ESTRELLA', 'GALAXIA', 'SATURNO', 'MARTE'];
  const result = generateWordSearch(words, 12, 12, 'medium', 'test-seed');
  assert.equal(result.grid.length, 12);
  assert.ok(result.grid.every(row => row.length === 12));
  assert.equal(result.placements.length, words.length);
  assert.deepEqual(result.skippedWords, []);
  for (const word of words) assert.ok(findWords(result.grid, [word]).length > 0, `${word} should be findable`);
  assert.deepEqual(graphemes('がっこう'), ['が', 'っ', 'こ', 'う']);
  assert.equal(normalized('が'), 'が');
  assert.equal(parseGrid('你好A\n世界B\n中文C').length, 3);
});

test('generator supports all eight directions and easy mode limits directions', () => {
  const words = ['ALPHA', 'BRAVO', 'CHARLIE', 'DELTA'];
  const easy = generateWordSearch(words, 12, 12, 'easy', 'easy-seed');
  assert.ok(easy.placements.every(item => ['right', 'down'].includes(item.direction)));
  const hard = generateWordSearch(words, 12, 12, 'hard', 'hard-seed');
  assert.ok(hard.placements.every(item => item.direction.includes('-')));
});

test('generator reports words that cannot fit instead of silently dropping them', () => {
  const result = generateWordSearch(['CAT', 'EXTRAORDINARY'], 5, 5, 'medium', 'small');
  assert.ok(result.words.includes('CAT'));
  assert.deepEqual(result.skippedWords, ['EXTRAORDINARY']);
});

test('generator supports Chinese and Japanese grapheme cells with Latin filler', () => {
  const words = ['你好', '日本語', 'がっこう'];
  const result = generateWordSearch(words, 12, 12, 'medium', 'cjk-seed');
  assert.equal(result.placements.length, words.length);
  for (const word of words) assert.ok(findWords(result.grid, [word]).length > 0, `${word} should be findable`);
  assert.deepEqual(graphemes('がっこう'), ['が', 'っ', 'こ', 'う']);
  assert.equal(normalized('が'), 'が');
  assert.equal(parseGrid('你好A\n世界B\n中文C').length, 3);
  const used = new Set(result.placements.flatMap(item => item.cells.map(({ r, c }) => `${r}-${c}`)));
  result.grid.forEach((row, r) => row.forEach((cell, c) => {
    if (!used.has(`${r}-${c}`)) assert.match(cell, /^[A-Z]$/);
  }));
});

test('seeded generation is repeatable', () => {
  const a = generateWordSearch(['HOUSE', 'CAT', 'TREE'], 10, 10, 'medium', 'same');
  const b = generateWordSearch(['HOUSE', 'CAT', 'TREE'], 10, 10, 'medium', 'same');
  assert.deepEqual(a.grid, b.grid);
  assert.deepEqual(a.placements, b.placements);
});
