import { escapeHtml, fmtDate, statusPill, toast } from '../ui.js';
import { groupShortagesBySupplier, buildWhatsappText, canManageOrders, ORDER_STATUSES, SIN_PROVEEDOR } from '../domain.js';

export function renderPedidos(root, ctx) {
  const canManage = canManageOrders(ctx.user.role);
  const groups = groupShortagesBySupplier(ctx.state.shortages);

  const buildSection = canManage ? `
    <section class="panel">
      <div class="panel-title-row"><h2>Armar pedidos por proveedor</h2><span class="muted">Faltantes pendientes o revisados</span></div>
      ${groups.length ? `<div class="group-grid">${groups.map((g, gi) => `
        <article class="supplier-group">
          <div class="row-head"><strong>${escapeHtml(g.supplier)}</strong><span class="count">${g.items.length}</span></div>
          <ul class="mini-list">${g.items.slice(0, 6).map(i => `<li>${escapeHtml(i.productSnapshot?.officialName || i.unclassifiedText)} — ${escapeHtml(String(i.quantity))} ${escapeHtml(i.unit)}</li>`).join('')}${g.items.length > 6 ? `<li class="muted">y ${g.items.length - 6} más…</li>` : ''}</ul>
          <button class="primary-action" data-make="${gi}" ${g.supplier === SIN_PROVEEDOR ? 'disabled title="Asigná un proveedor primero"' : ''}>Crear pedido</button>
        </article>`).join('')}</div>` : '<p class="empty">No hay faltantes pendientes para pedir.</p>'}
    </section>` : '';

  const orders = ctx.state.orders;
  const ordersSection = `
    <section class="panel">
      <div class="panel-title-row"><h2>Pedidos creados</h2><span class="muted">${orders.length} en total</span></div>
      <div class="orders">${orders.length ? orders.map(o => `
        <article class="row">
          <div class="row-head"><strong>${escapeHtml(o.supplier)}</strong>${statusPill(o.status)}<span class="muted">${o.items.length} ítems</span></div>
          <p class="muted">${escapeHtml(o.createdBy)} · ${fmtDate(o.createdAt)}</p>
          <ul class="mini-list">${o.items.map(i => `<li>${escapeHtml(i.label)} — ${escapeHtml(String(i.quantity))} ${escapeHtml(i.unit)}</li>`).join('')}</ul>
          <div class="order-actions">
            <a class="btn-wa" data-wa="${escapeHtml(o.id)}" target="_blank" rel="noopener">Enviar por WhatsApp</a>
            <button class="btn-copy" data-copy="${escapeHtml(o.id)}">Copiar texto</button>
            ${canManage ? `<select data-ostatus="${escapeHtml(o.id)}">${ORDER_STATUSES.map(s => `<option ${s === o.status ? 'selected' : ''}>${s}</option>`).join('')}</select>` : ''}
          </div>
        </article>`).join('') : '<p class="empty">Todavía no creaste pedidos.</p>'}</div>
    </section>`;

  root.innerHTML = `<div class="stack">${buildSection}${ordersSection}</div>`;

  const supplierWhatsapp = name => {
    const s = ctx.state.suppliers.find(x => x.name === name);
    return s?.whatsapp || s?.phone || '';
  };
  const waText = order => encodeURIComponent(buildWhatsappText(order, ctx.businessName));

  // Armar pedido desde un grupo
  if (canManage) root.querySelectorAll('[data-make]').forEach(btn => btn.addEventListener('click', async () => {
    const group = groups[Number(btn.dataset.make)];
    btn.disabled = true;
    try {
      await ctx.createOrder({ supplier: group.supplier, shortages: group.items });
      toast(`Pedido para ${group.supplier} creado.`);
    } catch (err) { toast(err.message, 'error'); btn.disabled = false; }
  }));

  // Acciones sobre pedidos creados
  root.querySelectorAll('[data-wa]').forEach(a => {
    const order = orders.find(o => o.id === a.dataset.wa);
    const number = supplierWhatsapp(order.supplier).replace(/\D/g, '');
    a.href = `https://wa.me/${number}?text=${waText(order)}`;
  });
  root.querySelectorAll('[data-copy]').forEach(btn => btn.addEventListener('click', async () => {
    const order = orders.find(o => o.id === btn.dataset.copy);
    try {
      await navigator.clipboard.writeText(buildWhatsappText(order, ctx.businessName));
      toast('Texto del pedido copiado.');
    } catch { toast('No se pudo copiar automáticamente.', 'error'); }
  }));
  if (canManage) root.querySelectorAll('[data-ostatus]').forEach(sel => sel.addEventListener('change', async () => {
    try { await ctx.updateOrderStatus(sel.dataset.ostatus, sel.value); toast('Pedido actualizado.'); }
    catch (err) { toast(err.message, 'error'); }
  }));
}
