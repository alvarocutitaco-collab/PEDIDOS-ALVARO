import { escapeHtml, toast } from '../ui.js';
import { saveSupabaseConfig, chooseDemo, BUSINESS_NAME } from '../config.js';

export function renderConnect(root) {
  root.innerHTML = `
    <div class="auth-wrap">
      <div class="auth-card">
        <p class="eyebrow">${escapeHtml(BUSINESS_NAME)}</p>
        <h1>Conectar la app</h1>
        <p class="muted">Pegá los 2 datos de tu proyecto Supabase. Los encontrás en
        Supabase → <strong>Project Settings → Data API</strong> (o <strong>API</strong>).</p>

        <form id="form-connect" class="auth-form">
          <label>URL del proyecto
            <input id="c-url" placeholder="https://xxxxxxxx.supabase.co" required>
          </label>
          <label>Clave pública (anon / publishable)
            <input id="c-key" placeholder="eyJ... (clave larga)" required>
          </label>
          <button class="primary-action" type="submit">Conectar</button>
        </form>

        <p class="muted" style="margin-top:14px">¿Todavía no lo configuraste?
          <button id="use-demo" class="linklike" type="button">Probar en modo demostración</button>
        </p>
      </div>
    </div>`;

  root.querySelector('#form-connect').addEventListener('submit', e => {
    e.preventDefault();
    const url = root.querySelector('#c-url').value.trim();
    const key = root.querySelector('#c-key').value.trim();
    if (!/^https:\/\/.+\.supabase\.co/.test(url)) return toast('La URL debe verse como https://xxxx.supabase.co', 'error');
    if (key.length < 30) return toast('La clave pública parece incompleta.', 'error');
    saveSupabaseConfig(url, key);
    toast('Conectado. Cargando…');
    setTimeout(() => location.reload(), 400);
  });

  root.querySelector('#use-demo').addEventListener('click', () => {
    chooseDemo();
    location.reload();
  });
}
