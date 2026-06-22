import { sampleProducts } from './catalog.js';
import { buildSearchIndex, searchProducts } from './search.js';
import { BUSINESS_NAME, isSupabaseConfigured, demoChosen, resetConnection } from './config.js';
import { initAuth, onAuthChange, signIn, signUp, signOut, getMode } from './auth.js';
import * as store from './storage.js';
import { canManageUsers, canManageOrders } from './domain.js';
import { renderLogin } from './views/login.js';
import { renderConnect } from './views/connect.js';
import { renderFaltantes } from './views/faltantes.js';
import { renderPedidos } from './views/pedidos.js';
import { renderUsuarios } from './views/usuarios.js';
import { renderImportar } from './views/importar.js';
import { escapeHtml, toast } from './ui.js';

const appEl = document.getElementById('app');
const state = { view: 'faltantes', shortages: [], orders: [], suppliers: [], users: [], ui: {} };
let currentUser = null;

// ---------------------------------------------------------
//  Búsqueda de productos: Web Worker con fallback síncrono
// ---------------------------------------------------------
let catalog = sampleProducts;
let fallbackIndex = buildSearchIndex(catalog);
let worker = null, workerReady = false, reqId = 0;
const pending = new Map();
if ('Worker' in window) {
  try {
    worker = new Worker('./search-worker.js', { type: 'module' });
    worker.onmessage = e => {
      if (e.data.type === 'ready') { workerReady = true; return; }
      if (e.data.type === 'results') {
        const resolve = pending.get(e.data.requestId);
        if (resolve) { pending.delete(e.data.requestId); resolve({ results: e.data.results, elapsedMs: e.data.elapsedMs }); }
      }
    };
  } catch { worker = null; }
}

// Carga el catálogo real (si existe) o el de ejemplo, y prepara la búsqueda.
async function loadCatalog() {
  let loaded = [];
  try { loaded = await store.listProducts(); } catch { loaded = []; }
  catalog = (loaded && loaded.length) ? loaded : sampleProducts;
  fallbackIndex = buildSearchIndex(catalog);
  if (worker) { workerReady = false; worker.postMessage({ type: 'init', products: catalog }); }
}

function search(query) {
  if (worker && workerReady) {
    reqId += 1;
    const id = reqId;
    return new Promise(resolve => { pending.set(id, resolve); worker.postMessage({ type: 'search', query, requestId: id, limit: 30 }); });
  }
  const t = performance.now();
  return Promise.resolve({ results: searchProducts(query, fallbackIndex, 30), elapsedMs: Math.round(performance.now() - t) });
}

// ---------------------------------------------------------
//  Datos
// ---------------------------------------------------------
async function loadData(user) {
  const [shortages, orders, suppliers] = await Promise.all([
    store.listShortages(), store.listOrders(), store.listSuppliers(), loadCatalog()
  ]);
  state.shortages = shortages;
  state.orders = orders;
  state.suppliers = suppliers;
  state.users = canManageUsers(user.role) ? await store.listUsers() : [];
}

function buildCtx() {
  const user = currentUser;
  return {
    user, mode: getMode(), businessName: BUSINESS_NAME, state, ui: state.ui, search, signIn, signUp,
    async saveShortage(input) {
      await store.saveShortage({ ...input, createdBy: user.fullName, createdById: user.id !== 'demo' ? user.id : null });
      state.shortages = await store.listShortages();
    },
    async updateShortageStatus(id, status) {
      await store.updateShortage(id, { status });
      state.shortages = await store.listShortages();
    },
    async createOrder({ supplier, shortages }) {
      await store.createOrderFromShortages({ supplier, shortages, user });
      state.shortages = await store.listShortages();
      state.orders = await store.listOrders();
      renderView();
    },
    async updateOrderStatus(id, status) {
      await store.updateOrder(id, { status });
      state.orders = await store.listOrders();
      renderView();
    },
    async setUserRole(id, role) { await store.setUserRole(id, role); },
    async setUserActive(id, active) { await store.setUserActive(id, active); },
    catalogCount: catalog.length,
    async replaceProducts(products) { const n = await store.replaceProducts(products); await loadCatalog(); return n; },
    async refresh() { await loadData(user); renderView(); }
  };
}

// ---------------------------------------------------------
//  Render
// ---------------------------------------------------------
const TABS = [
  { id: 'faltantes', label: 'Faltantes' },
  { id: 'pedidos', label: 'Pedidos' },
  { id: 'importar', label: 'Catálogo', needs: u => canManageUsers(u.role) },
  { id: 'usuarios', label: 'Usuarios', needs: u => canManageUsers(u.role) }
];

function renderView() {
  const view = document.getElementById('view');
  if (!view || !currentUser) return;
  const ctx = buildCtx();
  const admin = canManageUsers(currentUser.role);
  if (state.view === 'pedidos') renderPedidos(view, ctx);
  else if (state.view === 'usuarios' && admin) renderUsuarios(view, ctx);
  else if (state.view === 'importar' && admin) renderImportar(view, ctx);
  else { state.view = 'faltantes'; renderFaltantes(view, ctx); }
  document.querySelectorAll('.nav-tab').forEach(t => t.classList.toggle('active', t.dataset.view === state.view));
}

function renderShell() {
  const u = currentUser;
  const tabs = TABS.filter(t => !t.needs || t.needs(u));
  appEl.innerHTML = `
    <header class="app-header">
      <div>
        <p class="eyebrow">${escapeHtml(BUSINESS_NAME)}${getMode() === 'demo' ? ' · modo demostración' : ''}</p>
        <h1>Gestión de ferretería</h1>
      </div>
      <div class="user-box">
        <span><strong>${escapeHtml(u.fullName)}</strong><small>${escapeHtml(u.role)}</small></span>
        ${getMode() === 'demo' ? '<button id="connect-cloud" type="button">Conectar a la nube</button>' : ''}
        <button id="logout" type="button">Salir</button>
      </div>
    </header>
    <nav class="nav">${tabs.map(t => `<button class="nav-tab" data-view="${t.id}">${t.label}</button>`).join('')}</nav>
    <main id="view"></main>`;

  appEl.querySelectorAll('.nav-tab').forEach(tab => tab.addEventListener('click', () => {
    state.view = tab.dataset.view;
    renderView();
  }));
  appEl.querySelector('#logout').addEventListener('click', async () => {
    if (getMode() === 'demo') { toast('En modo demostración no hay sesión que cerrar.'); return; }
    await signOut();
  });
  const connectBtn = appEl.querySelector('#connect-cloud');
  if (connectBtn) connectBtn.addEventListener('click', () => { resetConnection(); location.reload(); });
  renderView();
}

function renderInactive() {
  appEl.innerHTML = `
    <div class="auth-wrap"><div class="auth-card">
      <h1>Cuenta sin acceso</h1>
      <p class="muted">Tu cuenta todavía no fue activada por un administrador.</p>
      <button class="primary-action" id="logout">Salir</button>
    </div></div>`;
  appEl.querySelector('#logout').addEventListener('click', () => signOut());
}

async function handleUser(user) {
  currentUser = user;
  if (!user) { renderLogin(appEl, buildCtxForLogin()); return; }
  if (user.active === false) { renderInactive(); return; }
  await loadData(user);
  renderShell();
}

function buildCtxForLogin() {
  return { businessName: BUSINESS_NAME, signIn, signUp };
}

function boot() {
  if (!isSupabaseConfigured && !demoChosen()) { renderConnect(appEl); return; }
  onAuthChange(handleUser);
  initAuth().catch(err => {
    appEl.innerHTML = `<div class="auth-wrap"><div class="auth-card"><h1>Error de inicio</h1><p class="muted">${escapeHtml(err.message)}</p></div></div>`;
  });
}
boot();
