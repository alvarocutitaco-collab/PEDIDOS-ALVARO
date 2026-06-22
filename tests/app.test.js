import assert from 'node:assert/strict';
import { createCatalog, products } from '../src/catalog.js';
import { normalizeText, buildSearchIndex, searchProducts } from '../src/search.js';
import { createShortage, STATUSES } from '../src/domain.js';

assert.equal(products.length, 8200);
assert.equal(createCatalog(9000).length, 9000);
assert.equal(normalizeText('Clávo Común '), 'clavo comun');

const index = buildSearchIndex(products);
assert.equal(searchProducts('clavo chico', index)[0].officialName, 'Clavo comun 1 pulgada');
assert.equal(searchProducts('CLA-1', index)[0].id, 'p-00001');
assert.ok(searchProducts('Pintureria Mayorista', index).every(product => product.suppliers.includes('Pintureria Mayorista')));
assert.ok(searchProducts('Cable bipolar', index).length > 10);

const started = performance.now();
searchProducts('tornillo', index, 30);
assert.ok(performance.now() - started < 100, 'La busqueda sobre 8200 productos debe ser rapida');

const classified = createShortage({ productId: 'p-00001', quantity: 2, unit: 'kg', urgency: 'alta', createdBy: 'Ana', productSnapshot: products[0] });
assert.equal(classified.status, 'pendiente');
assert.equal(classified.productId, 'p-00001');
assert.equal(classified.createdBy, 'Ana');
assert.equal(classified.productSnapshot.officialName, 'Clavo comun 1 pulgada');

const unclassified = createShortage({ unclassifiedText: 'pieza rara', quantity: 1 });
assert.equal(unclassified.productId, null);
assert.equal(unclassified.unclassifiedText, 'pieza rara');
assert.deepEqual(STATUSES, ['pendiente', 'revisado', 'pedido', 'recibido', 'cancelado']);

console.log('All tests passed');
