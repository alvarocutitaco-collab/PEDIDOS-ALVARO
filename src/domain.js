export const STATUSES = ['pendiente', 'revisado', 'pedido', 'recibido', 'cancelado'];
export const URGENCIES = ['normal', 'alta', 'baja'];

export function createId(prefix) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function createShortage(input) {
  if (!input.productId && !String(input.unclassifiedText || '').trim()) throw new Error('Debe seleccionar o escribir un producto.');
  const now = new Date().toISOString();
  return {
    id: input.id || createId('f'),
    productId: input.productId || null,
    productSnapshot: input.productSnapshot || null,
    unclassifiedText: input.productId ? '' : String(input.unclassifiedText || '').trim(),
    quantity: Number(input.quantity || 1),
    unit: input.unit || input.productSnapshot?.unit || 'unidad',
    urgency: URGENCIES.includes(input.urgency) ? input.urgency : 'normal',
    status: STATUSES.includes(input.status) ? input.status : 'pendiente',
    notes: input.notes || '',
    location: input.location || '',
    createdBy: input.createdBy || 'Sin usuario',
    createdAt: input.createdAt || now,
    updatedAt: input.updatedAt || now
  };
}

export function productLabel(shortage) {
  return shortage.productSnapshot?.officialName || shortage.unclassifiedText || 'Pendiente de clasificar';
}

