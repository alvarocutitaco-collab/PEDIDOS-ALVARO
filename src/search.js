export function normalizeText(value) {
  return String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
}

export function buildSearchText(product) {
  return [product.officialName, product.brand, product.category, product.internalCode, product.barcode, ...(product.suppliers || []), ...(product.aliases || [])]
    .map(normalizeText)
    .filter(Boolean)
    .join(' | ');
}

export function buildSearchIndex(products) {
  return products.map(product => ({ product, searchable: buildSearchText(product) }));
}

function scoreEntry(entry, query, words) {
  if (!query) return 0;
  const product = entry.product;
  const exactFields = [product.officialName, product.internalCode, product.barcode, ...(product.suppliers || []), ...(product.aliases || [])].map(normalizeText);
  if (exactFields.includes(query)) return 1000;
  if (entry.searchable.includes(query)) return 600 + Math.min(query.length, 100);
  const wordScore = words.reduce((score, word) => score + (entry.searchable.includes(word) ? 90 : 0), 0);
  return wordScore === words.length * 90 ? wordScore : wordScore / 2;
}

export function searchProducts(query, productsOrIndex, limit = 25) {
  const normalized = normalizeText(query);
  if (!normalized) return [];
  const words = normalized.split(/\s+/).filter(Boolean);
  const index = productsOrIndex[0]?.searchable ? productsOrIndex : buildSearchIndex(productsOrIndex);
  return index
    .map(entry => ({ product: entry.product, score: scoreEntry(entry, normalized, words) }))
    .filter(result => result.score > 0)
    .sort((a, b) => b.score - a.score || a.product.officialName.localeCompare(b.product.officialName))
    .slice(0, limit)
    .map(result => result.product);
}

