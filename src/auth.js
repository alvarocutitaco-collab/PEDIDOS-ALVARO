import { getSupabase, isSupabaseConfigured } from './supabase.js';

const DEMO_USER = { id: 'demo', email: 'demo@local', fullName: 'Usuario demo', role: 'administrador', active: true };
const listeners = new Set();
let current = null;

export function getMode() {
  return isSupabaseConfigured ? 'supabase' : 'demo';
}
export function getUser() {
  return current;
}
export function onAuthChange(callback) {
  listeners.add(callback);
  return () => listeners.delete(callback);
}
function emit() {
  listeners.forEach(cb => cb(current));
}

function traducirError(message = '') {
  const m = message.toLowerCase();
  if (m.includes('invalid login')) return 'Email o contraseña incorrectos.';
  if (m.includes('email not confirmed')) return 'Tenés que confirmar tu email antes de entrar.';
  if (m.includes('already registered')) return 'Ese email ya está registrado.';
  if (m.includes('password')) return 'La contraseña debe tener al menos 6 caracteres.';
  return message || 'Ocurrió un error inesperado.';
}

async function loadProfile(sb, userId, email) {
  let { data } = await sb.from('profiles').select('full_name, role, active').eq('id', userId).maybeSingle();
  if (!data || data.role !== 'administrador' || data.active === false) {
    const { data: admins } = await sb
      .from('profiles')
      .select('id')
      .eq('role', 'administrador')
      .eq('active', true)
      .limit(1);
    if (!admins?.length) {
      const { data: claimed } = await sb.rpc('claim_first_admin');
      if (claimed) data = claimed;
    }
  }
  return {
    id: userId,
    email,
    fullName: data?.full_name || email,
    role: data?.role || 'trabajador',
    active: data?.active !== false
  };
}

export async function initAuth() {
  if (getMode() === 'demo') {
    current = DEMO_USER;
    emit();
    return current;
  }
  const sb = await getSupabase();
  sb.auth.onAuthStateChange(async (_event, session) => {
    current = session?.user ? await loadProfile(sb, session.user.id, session.user.email) : null;
    emit();
  });
  const { data } = await sb.auth.getSession();
  current = data.session?.user ? await loadProfile(sb, data.session.user.id, data.session.user.email) : null;
  emit();
  return current;
}

export async function signIn(email, password) {
  if (getMode() === 'demo') {
    current = DEMO_USER;
    emit();
    return current;
  }
  const sb = await getSupabase();
  const { error } = await sb.auth.signInWithPassword({ email, password });
  if (error) throw new Error(traducirError(error.message));
}

export async function signUp(email, password, fullName) {
  if (getMode() === 'demo') throw new Error('El registro no está disponible en modo demostración.');
  const sb = await getSupabase();
  const { error } = await sb.auth.signUp({ email, password, options: { data: { full_name: fullName } } });
  if (error) throw new Error(traducirError(error.message));
}

export async function signOut() {
  if (getMode() === 'demo') return;
  const sb = await getSupabase();
  await sb.auth.signOut();
}
