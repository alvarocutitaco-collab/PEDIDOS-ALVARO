import { escapeHtml, fmtDate, statusPill, toast } from '../ui.js';
import { normalizeText } from '../search.js';
import { STATUSES, productLabel, canChangeStatus, primarySupplier } from '../domain.js';

export function renderFaltantes(root, ctx) {
  const ui = ctx.ui.faltantes ||= { query: '', selected: null, results: [], filterText: '', filterStatus: '', filterUrgency: '' };
  const canEdit = canChangeStatus(ctx.user.role);

  root.innerHTML = `
    <div class="layout">
      <section class="panel form-panel">
        <h2>Agregar faltante</h2>
        <p class="muted">Registra: <strong>${escapeHtml(ctx.user.fullName)}</strong></p>
        <label>Buscar producto, alias, código o proveedor
          <input id="search" autocomplete="off" placeholder="Ej: clavo chico, CLA-1, Alba..." value="${escapeHtml(ui.query)}">
        </label>
        <p id="searchMeta" class="muted"></p>
        <div id="suggestions" class="suggestions" aria-live="polite"></div>
        <div class="field-grid three">
          <label>Cantidad<input id="qty" type="number" min="0.01" step="0.01" value="1"></label>
          <label>Unidad<input id="unit" placeholder="unidad, caja, kg"></label>
          <label>Urgencia<select id="urgency"><option>normal</option><option>alta</option><option>baja</option></select></label>
        </div>
        <label>Local / área<input id="location" placeholder="Mostrador, depósito, sucursal..."></label>
        <label>Observación opcional<textarea id="notes" rows="2" placeholder="Ej: cliente lo pidió..."></textarea></label>
        <button id="save" class="primary-action">Guardar faltante</button>
        <p id="selected" class="muted"></p>
      </section>

      <section class="panel metrics-panel">
        <div class="metric"><strong id="mTotal">0</strong><span>Total</span></div>
        <div class="metric"><strong id="mPending">0</strong><span>Pendientes</span></div>
        <div class="metric"><strong id="mUrgent">0</strong><span>Urgentes</span></div>
        <div class="metric"><strong id="mUnclass">0</strong><span>Sin clasificar</span></div>
      </section>

      <section class="panel list-panel">
        <div class="panel-title-row"><h2>Faltantes</h2><span class="muted">Compartido entre todos</span></div>
        <div class="filters">
          <input id="fText" placeholder="Filtrar por producto, usuario, local..." value="${escapeHtml(ui.filterText)}">
          <select id="fStatus"><option value="">Todos los estados</option>${STATUSES.map(s => `<option ${ui.filterStatus === s ? 'selected' : ''}>${s}</option>`).join('')}</select>
          <select id="fUrgency"><option value="">Todas las urgencias</option>${['alta', 'normal', 'baja'].map(u => `<option ${ui.filterUrgency === u ? 'selected' : ''}>${u}</option>`).join('')}</select>
        </div>
        <div id="shortages" class="shortages"></div>
      </section>
    </div>`;

  const $ = sel => root.querySelector(sel);
  const setSelected = product => {
    ui.selected = product;
    if (product) {
      $('#unit').value = product.unit || '';
      $('#selected').textContent = `Seleccionado: ${product.officialName}`;
    } else {
      $('#selected').textContent = ui.query.trim()
        ? 'Sin producto seleccionado. Si guardás así, queda "pendiente de clasificar".'
        : '';
    }
  };

  function renderSuggestions() {
    $('#suggestions').innerHTML = ui.results.map(p => `
      <button class="suggestion" type="button" data-id="${escapeHtml(p.id)}">
        <strong>${escapeHtml(p.officialName)}</strong>
        <span>${escapeHtml(p.brand)} · ${escapeHtml(p.category)} · ${escapeHtml(p.internalCode)} · ${escapeHtml(p.unit)}</span>
        <small>${escapeHtml((p.aliases || []).slice(0, 4).join(' · '))}</small>
      </button>`).join('');
    $('#suggestions').querySelectorAll('.suggestion').forEach(node => node.addEventListener('click', () => {
      setSelected(ui.results.find(p => p.id === node.dataset.id));
    }));
  }

  async function doSearch() {
    ui.query = $('#search').value;
    setSelected(null);
    if (!ui.query.trim()) { ui.results = []; $('#searchMeta').textContent = ''; return renderSuggestions(); }
    const { results, elapsedMs } = await ctx.search(ui.query);
    ui.results = results;
    $('#searchMeta').textContent = `${results.length} resultados en ${elapsedMs} ms`;
    renderSuggestions();
  }

  function metrics() {
    const all = ctx.state.shortages;
    $('#mTotal').textContent = all.length;
    $('#mPending').textContent = all.filter(s => s.status === 'pendiente').length;
    $('#mUrgent').textContent = all.filter(s => s.urgency === 'alta' && s.status !== 'recibido' && s.status !== 'cancelado').length;
    $('#mUnclass').textContent = all.filter(s => !s.productId).length;
  }

  function matchesFilters(item) {
    const text = normalizeText(ui.filterText);
    const hay = normalizeText(`${productLabel(item)} ${item.createdBy} ${item.location} ${item.notes} ${item.supplier || ''}`);
    return (!text || hay.includes(text))
      && (!ui.filterStatus || item.status === ui.filterStatus)
      && (!ui.filterUrgency || item.urgency === ui.filterUrgency);
  }

  function renderList() {
    const rows = ctx.state.shortages.filter(matchesFilters).slice(0, 250);
    $('#shortages').innerHTML = rows.length ? rows.map(item => `
      <article class="row ${item.urgency === 'alta' ? 'urgent' : ''}">
        <div class="row-head">
          <strong>${escapeHtml(productLabel(item))}</strong>
          ${item.productId ? '' : '<span class="pill danger">sin clasificar</span>'}
          ${statusPill(item.status)}
        </div>
        <p>${escapeHtml(String(item.quantity))} ${escapeHtml(item.unit)} · urgencia ${escapeHtml(item.urgency)} · ${escapeHtml(item.location || 'sin local')}${item.supplier ? ' · ' + escapeHtml(item.supplier) : ''}</p>
        <p class="muted">${escapeHtml(item.createdBy)} · ${fmtDate(item.createdAt)}${item.notes ? ' · ' + escapeHtml(item.notes) : ''}</p>
        ${canEdit ? `<select data-status="${escapeHtml(item.id)}">${STATUSES.map(o => `<option ${o === item.status ? 'selected' : ''}>${o}</option>`).join('')}</select>` : ''}
      </article>`).join('') : '<p class="empty">No hay faltantes con esos filtros.</p>';

    if (canEdit) $('#shortages').querySelectorAll('[data-status]').forEach(node => node.addEventListener('change', async () => {
      try { await ctx.updateShortageStatus(node.dataset.status, node.value); toast('Estado actualizado.'); metrics(); renderList(); }
      catch (err) { toast(err.message, 'error'); }
    }));
  }

  // Eventos
  $('#search').addEventListener('input', doSearch);
  $('#save').addEventListener('click', async () => {
    try {
      await ctx.saveShortage({
        productId: ui.selected?.id,
        productSnapshot: ui.selected || null,
        supplier: primarySupplier(ui.selected),
        unclassifiedText: ui.query.trim(),
        quantity: $('#qty').value,
        unit: $('#unit').value || ui.selected?.unit,
        urgency: $('#urgency').value,
        notes: $('#notes').value,
        location: $('#location').value
      });
      ui.query = ''; ui.results = []; ui.selected = null;
      $('#search').value = ''; $('#qty').value = 1; $('#notes').value = ''; $('#unit').value = '';
      renderSuggestions(); metrics(); renderList();
      $('#selected').textContent = 'Faltante guardado.';
      toast('Faltante guardado.');
    } catch (err) {
      toast(err.message, 'error');
    }
  });
  $('#fText').addEventListener('input', e => { ui.filterText = e.target.value; renderList(); });
  $('#fStatus').addEventListener('change', e => { ui.filterStatus = e.target.value; renderList(); });
  $('#fUrgency').addEventListener('change', e => { ui.filterUrgency = e.target.value; renderList(); });

  renderSuggestions();
  metrics();
  renderList();
}
