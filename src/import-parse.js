import { normalizeText } from './search.js';

// Detecta el separador: Excel pegado usa TAB; CSV puede usar ; o ,
export function detectDelimiter(text) {
  const firstLine = (text.split(/\r?\n/).find(l => l.trim()) || '');
  if (firstLine.includes('\t')) return '\t';
  const semi = (firstLine.match(/;/g) || []).length;
  const comma = (firstLine.match(/,/g) || []).length;
  return semi > comma ? ';' : ',';
}

function parseLine(line, d) {
  const out = [];
  let cur = '', quoted = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (quoted) {
      if (ch === '"') { if (line[i + 1] === '"') { cur += '"'; i++; } else quoted = false; }
      else cur += ch;
    } else if (ch === '"') quoted = true;
    else if (ch === d) { out.push(cur); cur = ''; }
    else cur += ch;
  }
  out.push(cur);
  return out.map(s => s.trim());
}

export function parseTable(text, delimiter) {
  const d = delimiter || detectDelimiter(text);
  return text.replace(/\r\n?/g, '\n').split('\n').filter(l => l.trim().length).map(l => parseLine(l, d));
}

// Adivina qué columna es cada cosa según los títulos.
export function guessMapping(headers) {
  const norm = headers.map(h => normalizeText(h));
  const find = (...keys) => norm.findIndex(h => keys.some(k => h.includes(k)));
  return {
    description: find('descripcion', 'producto', 'nombre', 'detalle'),
    brand: find('marca'),
    salePrice: find('p vent', 'precio venta', 'p. venta', 'pvent', 'p_vent', 'precio', 'venta'),
    unit: find('und', 'unidad', 'um'),
    stock: find('st t', 'stock', 'existencia', 'st a'),
    code: find('codigo', 'cod', 'sku', 'barra')
  };
}

// ¿La primera fila parece encabezado? (si tiene "descripcion"/"marca" y no números)
export function looksLikeHeader(rows) {
  if (!rows.length) return false;
  const m = guessMapping(rows[0]);
  return m.description >= 0 || m.brand >= 0;
}

function parseNumber(value) {
  if (value == null || value === '') return null;
  let s = String(value).replace(/[^\d.,-]/g, '');
  if (s.includes(',') && s.includes('.')) s = s.replace(/,/g, '');
  else if (s.includes(',')) s = s.replace(',', '.');
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

// Convierte filas crudas en productos listos para el catálogo.
export function buildProducts(rows, mapping, hasHeader = true) {
  const data = hasHeader ? rows.slice(1) : rows;
  const get = (row, idx) => (idx >= 0 && idx < row.length ? row[idx] : '');
  const seen = new Map();
  const products = [];
  data.forEach((row, i) => {
    const description = get(row, mapping.description).trim();
    if (!description) return;
    const code = get(row, mapping.code).trim();
    let id = code || `imp-${i + 1}`;
    if (seen.has(id)) { seen.set(id, seen.get(id) + 1); id = `${id}-${seen.get(id)}`; } else seen.set(id, 0);
    products.push({
      id,
      officialName: description,
      brand: get(row, mapping.brand).trim(),
      category: '',
      internalCode: code,
      barcode: '',
      unit: get(row, mapping.unit).trim() || 'unidad',
      salePrice: parseNumber(get(row, mapping.salePrice)),
      stock: parseNumber(get(row, mapping.stock)),
      suppliers: [],
      aliases: []
    });
  });
  return products;
}
