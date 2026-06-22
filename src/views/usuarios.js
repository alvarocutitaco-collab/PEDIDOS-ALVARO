import { escapeHtml, toast } from '../ui.js';
import { ROLES } from '../domain.js';

export function renderUsuarios(root, ctx) {
  const users = ctx.state.users;
  root.innerHTML = `
    <section class="panel">
      <div class="panel-title-row"><h2>Usuarios y roles</h2><span class="muted">${users.length} usuarios</span></div>
      ${ctx.mode === 'demo' ? '<p class="notice">Estás en modo demostración. La gestión real de usuarios se habilita al conectar Supabase.</p>' : ''}
      <div class="roles-legend">
        <span><strong>Administrador:</strong> todo, incluye usuarios.</span>
        <span><strong>Encargado:</strong> cambia estados y arma pedidos.</span>
        <span><strong>Trabajador:</strong> registra faltantes.</span>
      </div>
      <div class="users">${users.map(u => `
        <article class="row">
          <div class="row-head"><strong>${escapeHtml(u.fullName)}</strong>${u.active ? '' : '<span class="pill danger">inactivo</span>'}</div>
          <p class="muted">${escapeHtml(u.email)}</p>
          <div class="order-actions">
            <select data-role="${escapeHtml(u.id)}" ${ctx.mode === 'demo' ? 'disabled' : ''}>${ROLES.map(r => `<option ${r === u.role ? 'selected' : ''}>${r}</option>`).join('')}</select>
            <button data-active="${escapeHtml(u.id)}" data-next="${u.active ? 'false' : 'true'}" ${ctx.mode === 'demo' ? 'disabled' : ''}>${u.active ? 'Desactivar' : 'Activar'}</button>
          </div>
        </article>`).join('')}</div>
    </section>`;

  root.querySelectorAll('[data-role]').forEach(sel => sel.addEventListener('change', async () => {
    try { await ctx.setUserRole(sel.dataset.role, sel.value); toast('Rol actualizado.'); }
    catch (err) { toast(err.message, 'error'); }
  }));
  root.querySelectorAll('[data-active]').forEach(btn => btn.addEventListener('click', async () => {
    try { await ctx.setUserActive(btn.dataset.active, btn.dataset.next === 'true'); toast('Usuario actualizado.'); ctx.refresh(); }
    catch (err) { toast(err.message, 'error'); }
  }));
}
