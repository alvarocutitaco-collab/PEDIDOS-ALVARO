import assert from 'node:assert/strict';
import { createCatalog, products } from '../src/catalog.js';
import { normalizeText, buildSearchIndex, searchProducts } from '../src/search.js';
import { createShortage, STATUSES, groupShortagesBySupplier, buildWhatsappText, createOrder, canChangeStatus, canManageUsers, SIN_PROVEEDOR } from '../src/domain.js';

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

// El faltante deriva el proveedor principal del producto.
assert.equal(classified.supplier, 'Aceros Centro');

// Permisos por rol.
assert.equal(canChangeStatus('encargado'), true);
assert.equal(canChangeStatus('trabajador'), false);
assert.equal(canManageUsers('administrador'), true);
assert.equal(canManageUsers('encargado'), false);

// Agrupar faltantes por proveedor (solo pendientes/revisados).
const a = createShortage({ productId: 'p-00001', productSnapshot: products[0], quantity: 3 });
const b = createShortage({ productId: 'p-00003', productSnapshot: products[2], quantity: 1 });
const c = createShortage({ unclassifiedText: 'algo raro', quantity: 1 });
const recibido = createShortage({ productId: 'p-00001', productSnapshot: products[0], quantity: 1, status: 'recibido' });
const groups = groupShortagesBySupplier([a, b, c, recibido]);
assert.equal(groups.length, 3);
assert.equal(groups.find(g => g.supplier === 'Aceros Centro').items.length, 1);
assert.equal(groups[groups.length - 1].supplier, SIN_PROVEEDOR);

// Pedido + texto para WhatsApp.
const order = createOrder({ supplier: 'Aceros Centro', items: [{ label: 'Clavo comun 1 pulgada', quantity: 3, unit: 'kg' }] });
assert.equal(order.status, 'borrador');
assert.equal(order.items.length, 1);
const wa = buildWhatsappText(order, 'Ferreteria Alvaro');
assert.ok(wa.includes('Ferreteria Alvaro'));
assert.ok(wa.includes('Aceros Centro'));
assert.ok(wa.includes('Clavo comun 1 pulgada — 3 kg'));

assert.throws(() => createOrder({ items: [] }), /al menos un faltante/);

console.log('All tests passed');
