/** Small strict RFC-4180-style reader. No network or account access. */
export function parseCSV(input) {
  const text = input.replace(/^\uFEFF/, '');
  const records = []; let row = [], field = '', quoted = false, closed = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (quoted) {
      if (c === '"' && text[i + 1] === '"') { field += '"'; i++; }
      else if (c === '"') { quoted = false; closed = true; }
      else field += c;
    } else if (c === '"') {
      if (field || closed) throw new Error('Unexpected quote in CSV field');
      quoted = true;
    } else if (c === ',') {
      row.push(field); field = ''; closed = false;
    } else if (c === '\n' || c === '\r') {
      if (c === '\r' && text[i + 1] === '\n') i++;
      row.push(field); records.push(row); row = []; field = ''; closed = false;
    } else {
      if (closed) throw new Error('Unexpected text after closing CSV quote');
      field += c;
    }
  }
  if (quoted) throw new Error('Unclosed CSV quote');
  if (row.length || field || closed) { row.push(field); records.push(row); }
  if (!records.length) return [];
  const headers = records.shift().map(x => x.trim());
  if (headers.some(x => !x) || new Set(headers).size !== headers.length)
    throw new Error('CSV headers must be non-empty and unique');
  return records.filter(r => !(r.length === 1 && r[0] === '')).map((r, i) => {
    if (r.length !== headers.length) throw new Error(`CSV record ${i + 2}: wrong column count`);
    return Object.fromEntries(headers.map((h, j) => [h, r[j]]));
  });
}
