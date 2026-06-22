import { escapeHtml, toast } from '../ui.js';
import { resetConnection } from '../config.js';

export function renderLogin(root, ctx) {
  root.innerHTML = `
    <div class="auth-wrap">
      <div class="auth-card">
        <p class="eyebrow">${escapeHtml(ctx.businessName)}</p>
        <h1>Gestión de ferretería</h1>
        <p class="muted">Ingresá con tu cuenta para acceder al sistema.</p>

        <div class="tabs" role="tablist">
          <button class="tab active" data-tab="in" type="button">Entrar</button>
          <button class="tab" data-tab="up" type="button">Crear cuenta</button>
        </div>

        <form id="form-in" class="auth-form">
          <label>Email<input id="in-email" type="email" autocomplete="email" required></label>
          <label>Contraseña<input id="in-pass" type="password" autocomplete="current-password" required></label>
          <button class="primary-action" type="submit">Entrar</button>
        </form>

        <form id="form-up" class="auth-form hidden">
          <label>Tu nombre<input id="up-name" autocomplete="name" required></label>
          <label>Email<input id="up-email" type="email" autocomplete="email" required></label>
          <label>Contraseña<input id="up-pass" type="password" autocomplete="new-password" minlength="6" required></label>
          <button class="primary-action" type="submit">Crear cuenta</button>
          <p class="muted">Después de crear la cuenta, un administrador te asigna el rol.</p>
        </form>

        <p class="muted" style="margin-top:14px">¿Datos de conexión equivocados?
          <button id="reconnect" class="linklike" type="button">Reconfigurar</button>
        </p>
      </div>
    </div>`;

  root.querySelector('#reconnect').addEventListener('click', () => { resetConnection(); location.reload(); });

  const formIn = root.querySelector('#form-in');
  const formUp = root.querySelector('#form-up');
  root.querySelectorAll('.tab').forEach(tab => tab.addEventListener('click', () => {
    root.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    tab.classList.add('active');
    const isIn = tab.dataset.tab === 'in';
    formIn.classList.toggle('hidden', !isIn);
    formUp.classList.toggle('hidden', isIn);
  }));

  formIn.addEventListener('submit', async e => {
    e.preventDefault();
    try {
      await ctx.signIn(root.querySelector('#in-email').value.trim(), root.querySelector('#in-pass').value);
    } catch (err) {
      toast(err.message, 'error');
    }
  });

  formUp.addEventListener('submit', async e => {
    e.preventDefault();
    try {
      await ctx.signUp(
        root.querySelector('#up-email').value.trim(),
        root.querySelector('#up-pass').value,
        root.querySelector('#up-name').value.trim()
      );
      toast('Cuenta creada. Revisá tu email para confirmarla.', 'ok');
    } catch (err) {
      toast(err.message, 'error');
    }
  });
}
