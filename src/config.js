// ============================================================
//  CONFIGURACIÓN — Pedidos Alvaro
// ============================================================
// 1. Creá tu proyecto en https://supabase.com (gratis).
// 2. En "Project Settings → API" copiá la "Project URL" y la
//    clave pública "anon".
// 3. Pegalas abajo entre las comillas y guardá el archivo.
//
// Guía paso a paso (sin tecnicismos): docs/setup-supabase.md
//
// Mientras estos campos estén vacíos, la app funciona en
// "MODO DEMOSTRACIÓN": podés probar todo, pero los datos se
// guardan SOLO en este dispositivo y no se comparten.
// ============================================================

export const SUPABASE_URL = '';
export const SUPABASE_ANON_KEY = '';

// Nombre del negocio (aparece en la cabecera y en los pedidos de WhatsApp).
export const BUSINESS_NAME = 'Pedidos Alvaro';

export const isSupabaseConfigured = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);
