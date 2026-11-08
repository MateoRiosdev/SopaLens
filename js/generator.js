import { normalized, graphemes } from './solver.js';

const DIRECTIONS = {
  easy: [{ dr: 0, dc: 1, id: 'right' }, { dr: 1, dc: 0, id: 'down' }],
  medium: [
    { dr: 0, dc: 1, id: 'right' }, { dr: 0, dc: -1, id: 'left' },
    { dr: 1, dc: 0, id: 'down' }, { dr: -1, dc: 0, id: 'up' },
    { dr: 1, dc: 1, id: 'down-right' }, { dr: 1, dc: -1, id: 'down-left' },
    { dr: -1, dc: 1, id: 'up-right' }, { dr: -1, dc: -1, id: 'up-left' }
  ],
  hard: [
    { dr: 1, dc: 1, id: 'down-right' }, { dr: 1, dc: -1, id: 'down-left' },
    { dr: -1, dc: 1, id: 'up-right' }, { dr: -1, dc: -1, id: 'up-left' }
  ]
};

function randomFromSeed(seed) {
  if (seed === undefined || seed === null) return Math.random;
  let value = 2166136261;
  for (const char of String(seed)) value = Math.imul(value ^ char.charCodeAt(0), 16777619);
  return () => {
    value += 0x6D2B79F5;
    let t = value;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function generateWordSearch(inputWords, rows = 10, cols = 10, difficulty = 'medium', seed) {
  rows = Math.max(3, Math.min(40, Math.floor(Number(rows) || 10)));
  cols = Math.max(3, Math.min(40, Math.floor(Number(cols) || 10)));
  const random = randomFromSeed(seed);
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const grid = Array.from({ length: rows }, () => Array(cols).fill(''));
  const words = [...new Set((inputWords || []).map(normalized).filter(word => graphemes(word).length >= 2))];
  const unitsByWord = new Map(words.map(word => [word, graphemes(word)]));
  const sorted = [...words].sort((a, b) => unitsByWord.get(b).length - unitsByWord.get(a).length || a.localeCompare(b));
  const directions = DIRECTIONS[difficulty] || DIRECTIONS.medium;
  const placements = [];
  const skippedWords = [];

  for (const word of sorted) {
    const units = unitsByWord.get(word);
    if (units.length > Math.max(rows, cols)) { skippedWords.push(word); continue; }
    let placed = false;
    for (let attempt = 0; attempt < 700 && !placed; attempt++) {
      const direction = directions[Math.floor(random() * directions.length)];
      const startR = Math.floor(random() * rows);
      const startC = Math.floor(random() * cols);
      const endR = startR + (units.length - 1) * direction.dr;
      const endC = startC + (units.length - 1) * direction.dc;
      if (endR < 0 || endR >= rows || endC < 0 || endC >= cols) continue;
      let compatible = true;
      for (let i = 0; i < units.length; i++) {
        const r = startR + i * direction.dr, c = startC + i * direction.dc;
        if (grid[r][c] && grid[r][c] !== units[i]) { compatible = false; break; }
      }
      if (!compatible) continue;
      const cells = [];
      for (let i = 0; i < units.length; i++) {
        const r = startR + i * direction.dr, c = startC + i * direction.dc;
        grid[r][c] = units[i]; cells.push({ r, c });
      }
      placements.push({ word, cells, direction: direction.id });
      placed = true;
    }
    if (!placed) skippedWords.push(word);
  }

  for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
    if (!grid[r][c]) grid[r][c] = alphabet[Math.floor(random() * alphabet.length)];
  }
  return { grid, placements, skippedWords, words: placements.map(item => item.word), rows, cols, difficulty };
}
