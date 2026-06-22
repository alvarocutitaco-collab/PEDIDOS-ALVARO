const assert = require('node:assert/strict');
const { normalizeText, searchProducts, createShortage, STATUSES } = require('../src/app');

assert.equal(normalizeText('Clávo Común '), 'clavo comun');
assert.equal(searchProducts('clavo chico')[0].officialName, 'Clavo comun 1 pulgada');
assert.equal(searchProducts('CLA-1')[0].id, 'p-001');
assert.equal(searchProducts('Pintureria Mayorista')[0].category, 'Pinturas');

const classified = createShortage({ productId: 'p-001', quantity: 2, unit: 'kg', urgency: 'alta', createdBy: 'Ana' });
assert.equal(classified.status, 'pendiente');
assert.equal(classified.productId, 'p-001');
assert.equal(classified.createdBy, 'Ana');

const unclassified = createShortage({ unclassifiedText: 'pieza rara', quantity: 1 });
assert.equal(unclassified.productId, null);
assert.equal(unclassified.unclassifiedText, 'pieza rara');
assert.deepEqual(STATUSES, ['pendiente', 'revisado', 'pedido', 'recibido', 'cancelado']);

console.log('All tests passed');
