const STORAGE_KEY = 'pedidosAlvaro.shortages.v1';
const STATUSES = ['pendiente', 'revisado', 'pedido', 'recibido', 'cancelado'];

const products = [
  { id: 'p-001', officialName: 'Clavo comun 1 pulgada', brand: 'Generico', category: 'Ferreteria', internalCode: 'CLA-1', barcode: '', unit: 'kg', suppliers: ['Aceros Centro'], aliases: ['clavo chico', 'clavitos', 'clavo común', 'clavo 1 pulgada'] },
  { id: 'p-002', officialName: 'Tornillo autoperforante 8 x 1/2', brand: 'Fixer', category: 'Tornilleria', internalCode: 'TOR-8-12', barcode: '', unit: 'caja', suppliers: ['Bulonera Norte'], aliases: ['tornillo chapa', 'autoperforante chico'] },
  { id: 'p-003', officialName: 'Cemento gris bolsa 50 kg', brand: 'Loma Negra', category: 'Construccion', internalCode: 'CEM-50', barcode: '', unit: 'bolsa', suppliers: ['Materiales Sur'], aliases: ['cemento', 'bolsa cemento', 'cemento 50'] },
  { id: 'p-004', officialName: 'Pintura latex interior blanco 20 l', brand: 'Alba', category: 'Pinturas', internalCode: 'PIN-LAT-20', barcode: '', unit: 'balde', suppliers: ['Pintureria Mayorista'], aliases: ['latex blanco', 'pintura blanca 20', 'balde latex'] }
];

const normalizeText = value => String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();

function searchProducts(query) {
  const normalized = normalizeText(query);
  if (!normalized) return [];
  return products
    .map(product => ({ product, score: scoreProduct(product, normalized) }))
    .filter(result => result.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 8)
    .map(result => result.product);
}

function scoreProduct(product, query) {
  const fields = [product.officialName, product.brand, product.category, product.internalCode, product.barcode, ...product.suppliers, ...product.aliases].map(normalizeText);
  if (fields.some(field => field === query)) return 100;
  if (fields.some(field => field.includes(query))) return 75;
  const words = query.split(/\s+/).filter(Boolean);
  return words.reduce((score, word) => score + (fields.some(field => field.includes(word)) ? 15 : 0), 0);
}

function loadShortages() {
  return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
}

function saveShortages(shortages) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(shortages));
}

function createShortage(input) {
  const now = new Date().toISOString();
  return {
    id: `f-${Date.now()}`,
    productId: input.productId || null,
    unclassifiedText: input.productId ? '' : input.unclassifiedText,
    quantity: Number(input.quantity || 1),
    unit: input.unit || 'unidad',
    urgency: input.urgency || 'normal',
    status: 'pendiente',
    notes: input.notes || '',
    location: input.location || '',
    createdBy: input.createdBy || 'Sin usuario',
    createdAt: now
  };
}

function addShortage(input) {
  const shortages = loadShortages();
  const shortage = createShortage(input);
  shortages.unshift(shortage);
  saveShortages(shortages);
  return shortage;
}

function updateShortageStatus(id, status) {
  if (!STATUSES.includes(status)) throw new Error(`Estado invalido: ${status}`);
  const shortages = loadShortages().map(item => item.id === id ? { ...item, status } : item);
  saveShortages(shortages);
}

function productLabel(productId) {
  const product = products.find(item => item.id === productId);
  return product ? product.officialName : 'Pendiente de clasificar';
}

if (typeof document !== 'undefined') {
  let selectedProduct = null;
  const $ = id => document.getElementById(id);

  function renderSuggestions() {
    const query = $('search').value;
    const suggestions = searchProducts(query);
    $('suggestions').innerHTML = suggestions.map(product => `<div class="suggestion" data-id="${product.id}"><strong>${product.officialName}</strong><br><span class="muted">${product.brand} · ${product.category} · ${product.internalCode}</span><br>${product.aliases.map(alias => `<span class="pill">${alias}</span>`).join('')}</div>`).join('');
    document.querySelectorAll('.suggestion').forEach(node => node.addEventListener('click', () => {
      selectedProduct = products.find(product => product.id === node.dataset.id);
      $('unit').value = selectedProduct.unit;
      $('selected').textContent = `Seleccionado: ${selectedProduct.officialName}`;
    }));
  }

  function renderShortages() {
    const text = normalizeText($('filterText').value);
    const status = $('filterStatus').value;
    const urgency = $('filterUrgency').value;
    const rows = loadShortages().filter(item => {
      const haystack = normalizeText(`${productLabel(item.productId)} ${item.unclassifiedText} ${item.createdBy} ${item.location} ${item.notes}`);
      return (!text || haystack.includes(text)) && (!status || item.status === status) && (!urgency || item.urgency === urgency);
    });
    $('shortages').innerHTML = rows.length ? rows.map(item => `<div class="row ${item.urgency === 'alta' ? 'urgent' : ''}"><strong>${productLabel(item.productId)}</strong>${item.unclassifiedText ? `<span class="pill danger">${item.unclassifiedText}</span>` : ''}<p>${item.quantity} ${item.unit} · urgencia ${item.urgency} · ${item.location || 'sin local'}</p><p class="muted">${item.createdBy} · ${new Date(item.createdAt).toLocaleString()} ${item.notes ? '· ' + item.notes : ''}</p><div class="row-actions"><select data-status="${item.id}">${STATUSES.map(option => `<option ${option === item.status ? 'selected' : ''}>${option}</option>`).join('')}</select></div></div>`).join('') : '<p class="muted">No hay faltantes con esos filtros.</p>';
    document.querySelectorAll('[data-status]').forEach(node => node.addEventListener('change', () => { updateShortageStatus(node.dataset.status, node.value); renderShortages(); }));
  }

  function renderProducts() {
    $('products').innerHTML = products.map(product => `<div class="product"><strong>${product.officialName}</strong><br><span class="muted">${product.brand} · ${product.category} · ${product.internalCode}</span><br>${product.aliases.map(alias => `<span class="pill">${alias}</span>`).join('')}</div>`).join('');
  }

  $('search').addEventListener('input', () => { selectedProduct = null; $('selected').textContent = 'Sin producto seleccionado. Si guardas así quedará pendiente de clasificar.'; renderSuggestions(); });
  ['filterText', 'filterStatus', 'filterUrgency'].forEach(id => $(id).addEventListener('input', renderShortages));
  $('save').addEventListener('click', () => {
    const query = $('search').value.trim();
    if (!selectedProduct && !query) return alert('Busca o escribe el producto faltante.');
    addShortage({ productId: selectedProduct?.id, unclassifiedText: query, quantity: $('qty').value, unit: $('unit').value || selectedProduct?.unit, urgency: $('urgency').value, notes: $('notes').value, location: $('location').value, createdBy: $('user').value });
    $('search').value = ''; $('qty').value = 1; $('notes').value = ''; selectedProduct = null; $('selected').textContent = 'Faltante guardado. Busca otro producto.'; renderSuggestions(); renderShortages();
  });
  renderProducts(); renderShortages();
}

if (typeof module !== 'undefined') module.exports = { products, normalizeText, searchProducts, createShortage, STATUSES };
