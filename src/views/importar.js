import { escapeHtml, toast } from '../ui.js';
import { parseTable, guessMapping, looksLikeHeader, buildProducts } from '../import-parse.js';

const FIELDS = [
  { key: 'description', label: 'Descripción', required: true },
  { key: 'brand', label: 'Marca' },
  { key: 'salePrice', label: 'Precio venta' },
  { key: 'unit', label: 'Unidad' },
  { key: 'stock', label: 'Stock' },
  { key: 'code', label: 'Código' }
];

export function renderImportar(root, ctx) {
  const ui = ctx.ui.importar ||= { rawText: '', rows: [], hasHeader: true, mapping: null };

  function analyze(text) {
    ui.rawText = text;
    ui.rows = parseTable(text);
    ui.hasHeader = looksLikeHeader(ui.rows);
    ui.mapping = guessMapping(ui.hasHeader ? ui.rows[0] : ui.rows[0] || []);
    render();
  }

  function colCount() {
    return ui.rows.reduce((m, r) => Math.max(m, r.length), 0);
  }
  function colLabel(i) {
    return ui.hasHeader && ui.rows[0] && ui.rows[0][i] ? `${i + 1}. ${ui.rows[0][i]}` : `Columna ${i + 1}`;
  }

  function render() {
    const hasData = ui.rows.length > 0;
    const cols = colCount();
    const products = hasData && ui.mapping ? buildProducts(ui.rows, ui.mapping, ui.hasHeader) : [];
    const preview = products.slice(0, 8);

    root.innerHTML = `
      <div class="stack">
        <section class="panel">
          <div class="panel-title-row"><h2>Catálogo de productos</h2><span class="muted">${ctx.catalogCount.toLocaleString('es-PE')} productos cargados hoy</span></div>
          <p class="muted">Importá tu catálogo desde el sistema actual. Podés <strong>pegar</strong> las filas copiadas de Excel, o <strong>subir un archivo CSV</strong>. Reemplaza el catálogo anterior.</p>
          <label>Pegá acá las filas (incluí la fila de títulos si la tenés)
            <textarea id="raw" rows="6" placeholder="DESCRIPCION	MARCA	P VENT	UND&#10;CLAVO 1 PULG	GENERICO	2.00	KG">${escapeHtml(ui.rawText)}</textarea>
          </label>
          <div class="field-grid three">
            <label>…o subí un archivo CSV<input id="file" type="file" accept=".csv,.txt,text/csv"></label>
          </div>
          <button id="analyze" class="primary-action">Analizar datos</button>
        </section>

        ${hasData ? `
        <section class="panel">
          <div class="panel-title-row"><h2>Revisá las columnas</h2><span class="muted">${ui.rows.length} filas leídas</span></div>
          <label class="inline"><input type="checkbox" id="hasHeader" ${ui.hasHeader ? 'checked' : ''}> La primera fila son títulos</label>
          <div class="map-grid">
            ${FIELDS.map(f => `<label>${f.label}${f.required ? ' *' : ''}
              <select data-map="${f.key}">
                <option value="-1">—</option>
                ${Array.from({ length: cols }, (_, i) => `<option value="${i}" ${ui.mapping[f.key] === i ? 'selected' : ''}>${escapeHtml(colLabel(i))}</option>`).join('')}
              </select></label>`).join('')}
          </div>
          <h3>Vista previa (${products.length} productos)</h3>
          <div class="preview-table">
            <table>
              <thead><tr><th>Descripción</th><th>Marca</th><th>Precio</th><th>Unidad</th><th>Stock</th></tr></thead>
              <tbody>${preview.map(p => `<tr><td>${escapeHtml(p.officialName)}</td><td>${escapeHtml(p.brand)}</td><td>${p.salePrice != null ? 'S/ ' + p.salePrice : ''}</td><td>${escapeHtml(p.unit)}</td><td>${p.stock != null ? p.stock : ''}</td></tr>`).join('')}</tbody>
            </table>
          </div>
          <button id="import" class="primary-action" ${ui.mapping.description < 0 || !products.length ? 'disabled' : ''}>Importar ${products.length} productos</button>
          ${ui.mapping.description < 0 ? '<p class="notice">Elegí qué columna es la <strong>Descripción</strong> para poder importar.</p>' : ''}
        </section>` : ''}
      </div>`;

    root.querySelector('#analyze').addEventListener('click', () => {
      const text = root.querySelector('#raw').value;
      if (!text.trim()) return toast('Pegá las filas o subí un archivo primero.', 'error');
      analyze(text);
    });
    root.querySelector('#file').addEventListener('change', async e => {
      const file = e.target.files[0];
      if (file) analyze(await file.text());
    });

    if (hasData) {
      root.querySelector('#hasHeader').addEventListener('change', e => { ui.hasHeader = e.target.checked; render(); });
      root.querySelectorAll('[data-map]').forEach(sel => sel.addEventListener('change', () => {
        ui.mapping[sel.dataset.map] = Number(sel.value);
        render();
      }));
      const importBtn = root.querySelector('#import');
      if (importBtn) importBtn.addEventListener('click', async () => {
        importBtn.disabled = true;
        importBtn.textContent = 'Importando…';
        try {
          const n = await ctx.replaceProducts(products);
          toast(`${n} productos importados. El buscador ya los usa.`);
          ui.rawText = ''; ui.rows = []; ui.mapping = null;
          render();
        } catch (err) {
          toast(err.message, 'error');
          importBtn.disabled = false;
          importBtn.textContent = `Importar ${products.length} productos`;
        }
      });
    }
  }

  render();
}
