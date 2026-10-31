/** Pure word-search and natural-language filtering helpers. No network calls. */
export const DIRECTIONS = [
  { dr: 0, dc: 1, id: 'right' }, { dr: 0, dc: -1, id: 'left' },
  { dr: 1, dc: 0, id: 'down' }, { dr: -1, dc: 0, id: 'up' },
  { dr: 1, dc: 1, id: 'down-right' }, { dr: 1, dc: -1, id: 'down-left' },
  { dr: -1, dc: 1, id: 'up-right' }, { dr: -1, dc: -1, id: 'up-left' }
];
export function normalized(value) {
  return String(value ?? '').replace(/ñ/g, '\uE000').replace(/Ñ/g, '\uE001').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleUpperCase().replace(/\uE000/g,'Ñ').replace(/\uE001/g,'Ñ').replace(/[^\p{L}]/gu, '');
}
export function graphemes(value) { return Array.from(normalized(value)); }
export function parseGrid(raw) {
  const lines = String(raw).split(/\r?\n/).map(line => graphemes(line)).filter(row => row.length);
  if (!lines.length) throw new Error('empty');
  const width = lines[0].length;
  if (width < 3 || lines.length < 3 || width > 40 || lines.length > 40 || lines.some(line => line.length !== width)) throw new Error('rectangular');
  return lines;
}
export function findWords(grid, candidates, categories = {}) {
  if (!grid?.length) return [];
  const height = grid.length, width = grid[0].length;
  const used = new Set(); const found = [];
  const words = [...new Set(candidates.map(normalized).filter(word => word.length >= 3 && word.length <= Math.max(height, width)))];
  for (const word of words) {
    const chars = Array.from(word);
    for (let r = 0; r < height; r++) for (let c = 0; c < width; c++) {
      if (normalized(grid[r][c]) !== chars[0]) continue;
      for (const dir of DIRECTIONS) {
        const lastR = r + (chars.length - 1) * dir.dr, lastC = c + (chars.length - 1) * dir.dc;
        if (lastR < 0 || lastR >= height || lastC < 0 || lastC >= width) continue;
        let ok = true;
        for (let i = 1; i < chars.length; i++) {
          if (normalized(grid[r + i * dir.dr][c + i * dir.dc]) !== chars[i]) { ok = false; break; }
        }
        if (!ok) continue;
        const cells = chars.map((_, i) => ({ r: r + dir.dr * i, c: c + dir.dc * i }));
        const unique = `${word}:${cells.map(({r,c}) => `${r}-${c}`).sort().join('/')}`;
        if (used.has(unique)) continue;
        used.add(unique);
        found.push({ id: unique, word, cells, direction: dir.id, category: categories[word] || 'other' });
      }
    }
  }
  return found.sort((a,b) => a.word.localeCompare(b.word) || a.id.localeCompare(b.id));
}
const NUMBER_WORDS = { uno:1, dos:2, tres:3, cuatro:4, cinco:5, seis:6, siete:7, ocho:8, nueve:9, ten:10, five:5, six:6, four:4, three:3, sept:7, cinq:5, funf:5, fünf:5 };
export function parseIntent(text) {
  const original = String(text || '').trim();
  const q = original.toLowerCase().replace(/ñ/g,'\uE000').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\uE000/g,'ñ');
  const has = (...words) => words.some(word => q.includes(word));
  const intent = { query: original, contains:'', starts:'', ends:'', length:null, direction:'', category:'', exact:'', understood:false };
  if (!q) return intent;
  const cat = [
    ['animals', ['animal','animais','animaux','tiere','animali','dieren','animals']],
    ['fruits', ['frut','fruit','obst','frutta','frutta','vrucht']],
    ['colors', ['color','colour','couleur','cor ','farben','colore','kleur']],
    ['food', ['comida','alimento','food','nourriture','essen','cibo','voedsel','menjar','comida']],
    ['nature', ['natur','naturaleza','natureza','natuur']],
    ['technology', ['tecnolog','technolog','informatica','technique','tecnic']],
    ['places', ['pais','paises','country','countries','ciudad','place','city','ville','stadt','paese','land']]
  ];
  for (const [id, words] of cat) if (words.some(word => q.includes(word))) { intent.category = id; intent.understood = true; break; }
  if (has('diagonal','diagonale','diagonais','diagonaal')) { intent.direction = 'diagonal'; intent.understood = true; }
  else if (has('horizontal','horizontale','horizontais')) { intent.direction = 'horizontal'; intent.understood = true; }
  else if (has('vertical','vertikale','verticais')) { intent.direction = 'vertical'; intent.understood = true; }
  const lengthMatch = q.match(/(?:\b(\d{1,2})\b|\b(uno|dos|tres|cuatro|cinco|seis|siete|ocho|nueve|ten|five|six|four|three|sept|cinq|funf)\b)\s*(?:letras?|letters?|lettres?|buchstaben|lettere|lletres?|caracteres?)/i) || q.match(/(?:letras?|letters?|lettres?|buchstaben|lettere|lletres?)\s*(?:de|of|with|con|mit|avec)?\s*(\d{1,2})/i);
  if (lengthMatch) { intent.length = Number(lengthMatch[1] || NUMBER_WORDS[lengthMatch[2]]); intent.understood = true; }
  const starts = q.match(/(?:empiec\w*|comienc\w*|inici\w*|comec\w*|começ\w*|start\w*|begin\w*|commenc\w*|anfang\w*|iniz\w*|beginnen\w*)\s*(?:por|con|with|com|par|mit|by|la|el|the|le|de)?\s*['\"]?([a-zñçäöü]{1,6})/i);
  const ends = q.match(/(?:termin\w*|acab\w*|end\w*|finiss\w*|finit\w*|enden\w*|eindig\w*)\s*(?:en|con|with|com|par|mit|in|by|la|el)?\s*['\"]?([a-zñçäöü]{1,6})/i);
  if (starts) { intent.starts = normalized(starts[1]); intent.understood = true; }
  if (ends) { intent.ends = normalized(ends[1]); intent.understood = true; }
  const letterBefore = q.match(/(?:con|com|with|avec|mit)\s+(?:la\s+|a\s+|the\s+)?(?:letra|letter|lettre|buchstabe|lettera|lletra)\s+([a-zñçäöü])\b/i);
  if (letterBefore) { intent.contains=normalized(letterBefore[1]); intent.understood=true; }
  const letter = q.match(/\b(?:letra|letter|lettre|buchstabe|lettera|lletra|litera)\b\s*(?:de|of|la|the|:)?\s*['\"]?([a-zñçäöü])\b/i)
    || q.match(/(?:que\s+tengan?|que\s+contengan?|containing|que\s+tenha|con\s+la|com\s+a|avec\s+la|with\s+the)\s*(?:la\s+)?['\"]?([a-zñçäöü])\b/i)
    || ((!starts && !ends) ? q.match(/\b(?:con|com|with|avec|mit)\s+['\"]?([a-zñçäöü])\b/i) : null);
  if (letter) { intent.contains = normalized(letter[1]); intent.understood = true; }
  const literal = q.match(/(?:palabra|word|mot|wort|parola|woord|paraula)\s*['\"]([^'\"]{3,30})['\"]/i);
  if (literal) { intent.exact = normalized(literal[1]); intent.understood = true; }
  if (has('todas','todos','all words','toutes','alle wort','tutte','todas as','alle woorden')) intent.understood = true;
  return intent;
}
export function filterMatches(found, intent) {
  if (!intent) return found;
  return found.filter(item => {
    if (intent.contains && !item.word.includes(intent.contains)) return false;
    if (intent.starts && !item.word.startsWith(intent.starts)) return false;
    if (intent.ends && !item.word.endsWith(intent.ends)) return false;
    if (intent.length && Array.from(item.word).length !== intent.length) return false;
    if (intent.exact && item.word !== intent.exact) return false;
    if (intent.category && item.category !== intent.category) return false;
    if (intent.direction === 'diagonal' && !item.direction.includes('-')) return false;
    if (intent.direction === 'horizontal' && !['left','right'].includes(item.direction)) return false;
    if (intent.direction === 'vertical' && !['up','down'].includes(item.direction)) return false;
    return true;
  });
}
/** Extract a likely rectangular letter grid from Tesseract's raw OCR text. */
export function extractGridText(ocrText) {
  const lines = String(ocrText || '').split(/\r?\n/).map(t => graphemes(t)).filter(r => r.length >= 4 && r.length <= 40);
  if (lines.length < 3) throw new Error('ocr-not-found');
  let best = null, score = -Infinity;
  for (let i = 0; i < lines.length; i++) {
    for (let j = i + 2; j < Math.min(lines.length, i + 40); j++) {
      const block = lines.slice(i,j+1), lengths = block.map(r=>r.length);
      const counts = new Map(); lengths.forEach(n=>counts.set(n,(counts.get(n)||0)+1));
      const [mode,count] = [...counts].sort((a,b)=>b[1]-a[1])[0];
      const consistency = count / block.length;
      const valid = mode>=4 && block.length>=3 && consistency>=0.7;
      const blockScore = valid ? count*8 + mode*0.3 - (block.length-count)*9 : -Infinity;
      if (blockScore>score) { score=blockScore; best={mode,block}; }
    }
  }
  if (!best) throw new Error('ocr-not-found');
  const rows = best.block.filter(r=>r.length===best.mode);
  if (rows.length<3) throw new Error('ocr-not-found');
  return rows.map(r=>r.join(' ')).join('\n');
}
