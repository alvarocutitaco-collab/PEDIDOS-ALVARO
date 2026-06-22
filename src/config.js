// ============================================================
//  CONFIGURACIÓN — Pedidos Alvaro
// ============================================================
// Ya NO hace falta editar este archivo a mano.
// La app tiene una pantalla para conectar Supabase pegando
// la URL y la clave (se guardan en este dispositivo).
//
// (Opcional) Si querés dejar la conexión fija para todos,
// podés completar estos valores de respaldo:
const FALLBACK_URL = '';
const FALLBACK_ANON_KEY = '';

export const BUSINESS_NAME = 'Ferreteria Alvaro Majes';

const STORAGE_KEY = 'pa.supabase';

function readSaved() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null'); } catch { return null; }
}

const saved = readSaved();
export const SUPABASE_URL = String(saved?.url || FALLBACK_URL).trim();
export const SUPABASE_ANON_KEY = String(saved?.key || FALLBACK_ANON_KEY).trim();
export const isSupabaseConfigured = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);

// ¿El usuario eligió expresamente probar en modo demostración?
export function demoChosen() {
  try { return localStorage.getItem('pa.demo') === '1'; } catch { return false; }
}
export function chooseDemo() {
  try { localStorage.setItem('pa.demo', '1'); } catch {}
}
export function saveSupabaseConfig(url, key) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ url: String(url).trim(), key: String(key).trim() }));
  try { localStorage.removeItem('pa.demo'); } catch {}
}
export function resetConnection() {
  try { localStorage.removeItem(STORAGE_KEY); localStorage.removeItem('pa.demo'); } catch {}
}
