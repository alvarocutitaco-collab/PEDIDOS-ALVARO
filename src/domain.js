export const STATUSES = ['pendiente', 'revisado', 'pedido', 'recibido', 'cancelado'];
export const URGENCIES = ['normal', 'alta', 'baja'];
export const ORDER_STATUSES = ['borrador', 'enviado', 'recibido', 'cancelado'];
export const ROLES = ['administrador', 'encargado', 'trabajador'];
export const SIN_PROVEEDOR = 'Sin proveedor asignado';

export function createId(prefix) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function primarySupplier(snapshot) {
  const list = snapshot?.suppliers;
  return Array.isArray(list) && list.length ? list[0] : null;
}

export function createShortage(input) {
  if (!input.productId && !String(input.unclassifiedText || '').trim()) throw new Error('Debe seleccionar o escribir un producto.');
  const now = new Date().toISOString();
  const snapshot = input.productSnapshot || null;
  return {
    id: input.id || createId('f'),
    productId: input.productId || null,
    productSnapshot: snapshot,
    supplier: input.supplier || primarySupplier(snapshot),
    unclassifiedText: input.productId ? '' : String(input.unclassifiedText || '').trim(),
    quantity: Number(input.quantity || 1),
    unit: input.unit || snapshot?.unit || 'unidad',
    urgency: URGENCIES.includes(input.urgency) ? input.urgency : 'normal',
    status: STATUSES.includes(input.status) ? input.status : 'pendiente',
    notes: input.notes || '',
    location: input.location || '',
    purchaseOrderId: input.purchaseOrderId || null,
    createdBy: input.createdBy || 'Sin usuario',
    createdById: input.createdById || null,
    createdAt: input.createdAt || now,
    updatedAt: input.updatedAt || now
  };
}

export function productLabel(shortage) {
  return shortage.productSnapshot?.officialName || shortage.unclassifiedText || 'Pendiente de clasificar';
}

// --- Permisos por rol ---
export function canChangeStatus(role) {
  return role === 'administrador' || role === 'encargado';
}
export function canManageOrders(role) {
  return role === 'administrador' || role === 'encargado';
}
export function canManageUsers(role) {
  return role === 'administrador';
}

// --- Agrupar faltantes por proveedor para armar pedidos ---
export function groupShortagesBySupplier(shortages) {
  const groups = new Map();
  for (const item of shortages) {
    if (item.status !== 'pendiente' && item.status !== 'revisado') continue;
    const key = item.supplier || SIN_PROVEEDOR;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(item);
  }
  return [...groups.entries()]
    .map(([supplier, items]) => ({ supplier, items }))
    .sort((a, b) => {
      if (a.supplier === SIN_PROVEEDOR) return 1;
      if (b.supplier === SIN_PROVEEDOR) return -1;
      return b.items.length - a.items.length || a.supplier.localeCompare(b.supplier);
    });
}

export function createOrder(input) {
  if (!input.items || !input.items.length) throw new Error('El pedido necesita al menos un faltante.');
  const now = new Date().toISOString();
  return {
    id: input.id || createId('oc'),
    supplier: input.supplier || SIN_PROVEEDOR,
    status: ORDER_STATUSES.includes(input.status) ? input.status : 'borrador',
    notes: input.notes || '',
    items: input.items.map(item => ({
      shortageId: item.shortageId || null,
      label: item.label,
      quantity: Number(item.quantity || 1),
      unit: item.unit || 'unidad'
    })),
    createdBy: input.createdBy || 'Sin usuario',
    createdById: input.createdById || null,
    createdAt: input.createdAt || now,
    updatedAt: input.updatedAt || now
  };
}

// Texto listo para pegar en WhatsApp al proveedor.
export function buildWhatsappText(order, businessName = 'Pedido') {
  const lines = [`*${businessName} — Pedido*`, `Proveedor: ${order.supplier}`, ''];
  order.items.forEach((item, i) => {
    lines.push(`${i + 1}. ${item.label} — ${item.quantity} ${item.unit}`);
  });
  if (order.notes) lines.push('', `Nota: ${order.notes}`);
  return lines.join('\n');
}
