import { products } from './catalog.js';
import { buildSearchIndex, searchProducts } from './search.js';

const index = buildSearchIndex(products);
self.postMessage({ type: 'ready', count: products.length });
self.onmessage = event => {
  const { query, requestId, limit } = event.data;
  const started = performance.now();
  const results = searchProducts(query, index, limit || 25);
  self.postMessage({ type: 'results', requestId, results, elapsedMs: Math.round(performance.now() - started) });
};
