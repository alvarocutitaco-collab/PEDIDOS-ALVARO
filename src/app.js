import { products } from './catalog.js';
import { normalizeText, buildSearchIndex, searchProducts } from './search.js';
import { STATUSES, createShortage, productLabel } from './domain.js';
import { getAllShortages, saveShortage, updateShortage } from './storage.js';

const state = { selectedProduct: null, results: [], shortages: [], workerReady: false, requestId: 0, fallbackIndex: buildSearchIndex(products) };
const $ = id => document.getElementById(id);
const worker = 'Worker' in window ? new Worker('./search-worker.js', { type: 'module' }) : null;

if (worker) {
  worker.onmessage = event => {
    if (event.data.type === 'ready') {
      state.workerReady = true;
      $('catalogCount').textContent = event.data.count.toLocaleString('es-AR');
      return;
    }
    if (event.data.type === 'results' && event.data.requestId === state.requestId) {
      state.results = event.data.results;
      $('searchMeta').textContent = `${event.data.results.length} resultados en ${event.data.elapsedMs} ms`;
      renderSuggestions();
    }
  };
}

function requestSearch() {
  state.selectedProduct = null;
  $('selected').textContent = 'Sin producto seleccionado. Si guardas así quedará pendiente de clasificar.';
  const query = $('search').value;
  if (!query.trim()) {
    state.results = [];
    $('searchMeta').textContent = '';
    return renderSuggestions();
  }
  state.requestId += 1;
  if (state.workerReady) worker.postMessage({ query, requestId: state.requestId, limit: 30 });
  else {
    const started = performance.now();
    state.results = searchProducts(query, state.fallbackIndex, 30);
    $('searchMeta').textContent = `${state.results.length} resultados en ${Math.round(performance.now() - started)} ms`;
    renderSuggestions();
  }
}

function renderSuggestions() {
  $('suggestions').innerHTML = state.results.map(product => `<button class="suggestion" type="button" data-id="${product.id}"><strong>${product.officialName}</strong><span>${product.brand} · ${product.category} · ${product.internalCode} · ${product.unit}</span><small>${product.aliases.slice(0, 4).join(' · ')}</small></button>`).join('');
  document.querySelectorAll('.suggestion').forEach(node => node.addEventListener('click', () => {
    state.selectedProduct = products.find(product => product.id === node.dataset.id);
    $('unit').value = state.selectedProduct.unit;
    $('selected').textContent = `Seleccionado: ${state.selectedProduct.officialName}`;
  }));
}

async function refreshShortages() {
  state.shortages = await getAllShortages();
  renderShortages();
  renderMetrics();
}

function shortageMatchesFilters(item) {
  const text = normalizeText($('filterText').value);
  const status = $('filterStatus').value;
  const urgency = $('filterUrgency').value;
  const haystack = normalizeText(`${productLabel(item)} ${item.createdBy} ${item.location} ${item.notes} ${item.status} ${item.urgency}`);
  return (!text || haystack.includes(text)) && (!status || item.status === status) && (!urgency || item.urgency === urgency);
}

function renderShortages() {
  const rows = state.shortages.filter(shortageMatchesFilters).slice(0, 250);
  $('shortages').innerHTML = rows.length ? rows.map(item => `<article class="row ${item.urgency === 'alta' ? 'urgent' : ''}"><div><strong>${productLabel(item)}</strong>${item.productId ? '' : '<span class="pill danger">pendiente de clasificar</span>'}</div><p>${item.quantity} ${item.unit} · urgencia ${item.urgency} · ${item.location || 'sin local'}</p><p class="muted">${item.createdBy} · ${new Date(item.createdAt).toLocaleString('es-AR')} ${item.notes ? '· ' + item.notes : ''}</p><select data-status="${item.id}" aria-label="Estado de ${productLabel(item)}">${STATUSES.map(option => `<option ${option === item.status ? 'selected' : ''}>${option}</option>`).join('')}</select></article>`).join('') : '<p class="empty">No hay faltantes con esos filtros.</p>';
  document.querySelectorAll('[data-status]').forEach(node => node.addEventListener('change', async () => { await updateShortage(node.dataset.status, { status: node.value }); await refreshShortages(); }));
}

function renderMetrics() {
  $('metricTotal').textContent = state.shortages.length;
  $('metricPending').textContent = state.shortages.filter(item => item.status === 'pendiente').length;
  $('metricUrgent').textContent = state.shortages.filter(item => item.urgency === 'alta' && item.status !== 'recibido').length;
  $('metricUnclassified').textContent = state.shortages.filter(item => !item.productId).length;
}

async function handleSave() {
  const query = $('search').value.trim();
  const shortage = createShortage({
    productId: state.selectedProduct?.id,
    productSnapshot: state.selectedProduct,
    unclassifiedText: query,
    quantity: $('qty').value,
    unit: $('unit').value || state.selectedProduct?.unit,
    urgency: $('urgency').value,
    notes: $('notes').value,
    location: $('location').value,
    createdBy: $('user').value
  });
  await saveShortage(shortage);
  $('search').value = '';
  $('qty').value = 1;
  $('notes').value = '';
  state.selectedProduct = null;
  state.results = [];
  $('selected').textContent = 'Faltante guardado. Busca otro producto.';
  renderSuggestions();
  await refreshShortages();
}

function renderProductsPreview() {
  $('productsPreview').innerHTML = products.slice(0, 40).map(product => `<div class="product"><strong>${product.officialName}</strong><span>${product.brand} · ${product.category} · ${product.internalCode}</span></div>`).join('');
  $('catalogCount').textContent = products.length.toLocaleString('es-AR');
}

$('search').addEventListener('input', requestSearch);
$('save').addEventListener('click', () => handleSave().catch(error => alert(error.message)));
['filterText', 'filterStatus', 'filterUrgency'].forEach(id => $(id).addEventListener('input', renderShortages));
renderProductsPreview();
refreshShortages();
