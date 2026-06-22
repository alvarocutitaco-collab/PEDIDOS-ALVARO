import { buildSearchIndex, searchProducts } from './search.js';

let index = [];

self.onmessage = event => {
  const data = event.data;
  if (data.type === 'init') {
    index = buildSearchIndex(data.products || []);
    self.postMessage({ type: 'ready', count: index.length });
    return;
  }
  if (data.type === 'search') {
    const started = performance.now();
    const results = searchProducts(data.query, index, data.limit || 25);
    self.postMessage({ type: 'results', requestId: data.requestId, results, elapsedMs: Math.round(performance.now() - started) });
  }
};
