import { getSupabase, isSupabaseConfigured } from './supabase.js';
import { createShortage, createOrder } from './domain.js';

const MODE = isSupabaseConfigured ? 'supabase' : 'demo';

// ============================================================
//  MODO DEMOSTRACIÓN — datos en localStorage de este dispositivo
// ============================================================
const LS = {
  read(key) {
    try { return JSON.parse(localStorage.getItem(key) || '[]'); } catch { return []; }
  },
  write(key, value) { localStorage.setItem(key, JSON.stringify(value)); }
};
const KEY_SHORTAGES = 'pa.shortages';
const KEY_ORDERS = 'pa.orders';
const KEY_SUPPLIERS = 'pa.suppliers';
const KEY_PRODUCTS = 'pa.products';

const demoBackend = {
  async listShortages() {
    return LS.read(KEY_SHORTAGES).sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));
  },
  async createShortageRecord(shortage) {
    const all = LS.read(KEY_SHORTAGES);
    all.push(shortage);
    LS.write(KEY_SHORTAGES, all);
    return shortage;
  },
  async updateShortage(id, patch) {
    const all = LS.read(KEY_SHORTAGES);
    const idx = all.findIndex(s => s.id === id);
    if (idx === -1) throw new Error('Faltante no encontrado.');
    all[idx] = { ...all[idx], ...patch, updatedAt: new Date().toISOString() };
    LS.write(KEY_SHORTAGES, all);
    return all[idx];
  },
  async listOrders() {
    return LS.read(KEY_ORDERS).sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));
  },
  async createOrderRecord(order, shortageIds) {
    const orders = LS.read(KEY_ORDERS);
    orders.push(order);
    LS.write(KEY_ORDERS, orders);
    const shortages = LS.read(KEY_SHORTAGES);
    shortages.forEach(s => {
      if (shortageIds.includes(s.id)) { s.status = 'pedido'; s.purchaseOrderId = order.id; s.updatedAt = new Date().toISOString(); }
    });
    LS.write(KEY_SHORTAGES, shortages);
    return order;
  },
  async updateOrder(id, patch) {
    const orders = LS.read(KEY_ORDERS);
    const idx = orders.findIndex(o => o.id === id);
    if (idx === -1) throw new Error('Pedido no encontrado.');
    orders[idx] = { ...orders[idx], ...patch, updatedAt: new Date().toISOString() };
    LS.write(KEY_ORDERS, orders);
    return orders[idx];
  },
  async listSuppliers() {
    return LS.read(KEY_SUPPLIERS).sort((a, b) => a.name.localeCompare(b.name));
  },
  async listProducts() {
    return LS.read(KEY_PRODUCTS);
  },
  async replaceProducts(products) {
    LS.write(KEY_PRODUCTS, products);
    return products.length;
  },
  async listUsers() {
    return [{ id: 'demo', email: 'demo@local', fullName: 'Usuario demo', role: 'administrador', active: true }];
  },
  async setUserRole() { throw new Error('La gestión de usuarios no está disponible en modo demostración.'); },
  async setUserActive() { throw new Error('La gestión de usuarios no está disponible en modo demostración.'); }
};

// ============================================================
//  MODO SUPABASE — base de datos compartida en la nube
// ============================================================
function shortageToRow(s) {
  return {
    id: s.id,
    product_id: s.productId,
    product_snapshot: s.productSnapshot,
    supplier: s.supplier,
    unclassified_text: s.unclassifiedText,
    quantity: s.quantity,
    unit: s.unit,
    urgency: s.urgency,
    status: s.status,
    notes: s.notes,
    location: s.location,
    purchase_order_id: s.purchaseOrderId,
    created_by: s.createdById,
    created_by_name: s.createdBy,
    created_at: s.createdAt,
    updated_at: s.updatedAt
  };
}
function rowToShortage(r) {
  return {
    id: r.id,
    productId: r.product_id,
    productSnapshot: r.product_snapshot,
    supplier: r.supplier,
    unclassifiedText: r.unclassified_text || '',
    quantity: Number(r.quantity),
    unit: r.unit,
    urgency: r.urgency,
    status: r.status,
    notes: r.notes || '',
    location: r.location || '',
    purchaseOrderId: r.purchase_order_id,
    createdBy: r.created_by_name || 'Sin usuario',
    createdById: r.created_by,
    createdAt: r.created_at,
    updatedAt: r.updated_at
  };
}

function productToRow(p) {
  return { id: p.id, description: p.officialName, brand: p.brand || null, sale_price: p.salePrice ?? null, unit: p.unit || 'unidad', stock: p.stock ?? null, code: p.internalCode || null, active: true };
}
function rowToProduct(r) {
  return { id: r.id, officialName: r.description, brand: r.brand || '', category: '', internalCode: r.code || '', barcode: '', unit: r.unit || 'unidad', salePrice: r.sale_price, stock: r.stock, suppliers: [], aliases: [] };
}

async function sbClient() {
  const sb = await getSupabase();
  if (!sb) throw new Error('Supabase no está configurado.');
  return sb;
}
function check(error) {
  if (error) throw new Error(error.message);
}

const supabaseBackend = {
  async listShortages() {
    const sb = await sbClient();
    const { data, error } = await sb.from('shortages').select('*').order('created_at', { ascending: false });
    check(error);
    return (data || []).map(rowToShortage);
  },
  async createShortageRecord(shortage) {
    const sb = await sbClient();
    const { error } = await sb.from('shortages').insert(shortageToRow(shortage));
    check(error);
    return shortage;
  },
  async updateShortage(id, patch) {
    const sb = await sbClient();
    const row = {};
    if ('status' in patch) row.status = patch.status;
    if ('notes' in patch) row.notes = patch.notes;
    row.updated_at = new Date().toISOString();
    const { error } = await sb.from('shortages').update(row).eq('id', id);
    check(error);
    return { id, ...patch };
  },
  async listOrders() {
    const sb = await sbClient();
    const { data, error } = await sb
      .from('purchase_orders')
      .select('*, purchase_order_items(*)')
      .order('created_at', { ascending: false });
    check(error);
    return (data || []).map(o => ({
      id: o.id,
      supplier: o.supplier,
      status: o.status,
      notes: o.notes || '',
      createdBy: o.created_by_name || 'Sin usuario',
      createdById: o.created_by,
      createdAt: o.created_at,
      updatedAt: o.updated_at,
      items: (o.purchase_order_items || []).map(i => ({
        shortageId: i.shortage_id, label: i.label, quantity: Number(i.quantity), unit: i.unit
      }))
    }));
  },
  async createOrderRecord(order, shortageIds) {
    const sb = await sbClient();
    const { error: e1 } = await sb.from('purchase_orders').insert({
      id: order.id, supplier: order.supplier, status: order.status, notes: order.notes,
      created_by: order.createdById, created_by_name: order.createdBy,
      created_at: order.createdAt, updated_at: order.updatedAt
    });
    check(e1);
    const items = order.items.map(i => ({
      purchase_order_id: order.id, shortage_id: i.shortageId, label: i.label, quantity: i.quantity, unit: i.unit
    }));
    const { error: e2 } = await sb.from('purchase_order_items').insert(items);
    check(e2);
    const { error: e3 } = await sb.from('shortages')
      .update({ status: 'pedido', purchase_order_id: order.id, updated_at: new Date().toISOString() })
      .in('id', shortageIds);
    check(e3);
    return order;
  },
  async updateOrder(id, patch) {
    const sb = await sbClient();
    const { error } = await sb.from('purchase_orders').update({ ...patch, updated_at: new Date().toISOString() }).eq('id', id);
    check(error);
    return { id, ...patch };
  },
  async listSuppliers() {
    const sb = await sbClient();
    const { data, error } = await sb.from('suppliers').select('*').order('name');
    check(error);
    return data || [];
  },
  async listProducts() {
    const sb = await sbClient();
    const all = [];
    const size = 1000;
    for (let from = 0; ; from += size) {
      const { data, error } = await sb.from('products').select('*').range(from, from + size - 1);
      check(error);
      all.push(...(data || []));
      if (!data || data.length < size) break;
    }
    return all.map(rowToProduct);
  },
  async replaceProducts(products) {
    const sb = await sbClient();
    const { error: delErr } = await sb.from('products').delete().not('id', 'is', null);
    check(delErr);
    const rows = products.map(productToRow);
    for (let i = 0; i < rows.length; i += 500) {
      const { error } = await sb.from('products').insert(rows.slice(i, i + 500));
      check(error);
    }
    return products.length;
  },
  async listUsers() {
    const sb = await sbClient();
    const { data, error } = await sb.from('profiles').select('id, email, full_name, role, active').order('full_name');
    check(error);
    return (data || []).map(u => ({ id: u.id, email: u.email, fullName: u.full_name, role: u.role, active: u.active }));
  },
  async setUserRole(id, role) {
    const sb = await sbClient();
    const { error } = await sb.from('profiles').update({ role }).eq('id', id);
    check(error);
  },
  async setUserActive(id, active) {
    const sb = await sbClient();
    const { error } = await sb.from('profiles').update({ active }).eq('id', id);
    check(error);
  }
};

const backend = MODE === 'supabase' ? supabaseBackend : demoBackend;

// ============================================================
//  API pública (igual para los dos modos)
// ============================================================
export const storageMode = MODE;

export function listShortages() { return backend.listShortages(); }
export function saveShortage(shortage) { return backend.createShortageRecord(createShortage(shortage)); }
export function updateShortage(id, patch) { return backend.updateShortage(id, patch); }

export function listOrders() { return backend.listOrders(); }
export async function createOrderFromShortages({ supplier, shortages, notes, user }) {
  const items = shortages.map(s => ({
    shortageId: s.id,
    label: s.productSnapshot?.officialName || s.unclassifiedText || 'Producto',
    quantity: s.quantity,
    unit: s.unit
  }));
  const order = createOrder({ supplier, items, notes, createdBy: user?.fullName, createdById: user?.id !== 'demo' ? user?.id : null });
  return backend.createOrderRecord(order, shortages.map(s => s.id));
}
export function updateOrder(id, patch) { return backend.updateOrder(id, patch); }

export function listSuppliers() { return backend.listSuppliers(); }
export function listProducts() { return backend.listProducts(); }
export function replaceProducts(products) { return backend.replaceProducts(products); }
export function listUsers() { return backend.listUsers(); }
export function setUserRole(id, role) { return backend.setUserRole(id, role); }
export function setUserActive(id, active) { return backend.setUserActive(id, active); }
