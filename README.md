# Pedidos Alvaro — Gestión de ferretería

Sistema interno para administrar una ferretería: registrar faltantes, armar pedidos por proveedor y gestionar usuarios, **compartido en tiempo real entre todos los empleados** desde el celular o la PC.

No es una tienda para clientes: es la herramienta de trabajo interna del negocio.

## Módulos de esta versión

- **Faltantes** — cuaderno digital: buscador rápido de productos (nombre, alias, marca, código, código de barras, proveedor), registro en segundos, lista filtrable y métricas.
- **Pedidos** — agrupa los faltantes por proveedor y arma el pedido con un clic, con texto listo para enviar por **WhatsApp**.
- **Usuarios y roles** — login y permisos: **administrador**, **encargado** y **trabajador**.

## Dos modos de funcionamiento

- **Modo demostración** (sin configurar nada): la app funciona, pero los datos se guardan solo en ese dispositivo. Ideal para probar.
- **Modo real** (con Supabase): base de datos en la nube + login, datos compartidos entre todos. Ver guía abajo.

## Puesta en marcha (paso a paso, sin tecnicismos)

👉 **`docs/setup-supabase.md`** — crear el proyecto en Supabase, cargar la base de datos, conectar la app, crear usuarios y publicarla en internet.

El esquema de base de datos listo para ejecutar está en **`supabase/schema.sql`**.

## Probar localmente

```bash
python3 -m http.server 4173 -d src
# abrir http://localhost:4173
```

## Tests

```bash
npm test
```

## Estructura del código

- `src/config.js` — credenciales de Supabase y nombre del negocio.
- `src/supabase.js` / `src/auth.js` — conexión y autenticación (con fallback a modo demostración).
- `src/storage.js` — capa de datos con dos motores: Supabase y localStorage.
- `src/domain.js` — lógica de negocio (faltantes, pedidos, roles, WhatsApp).
- `src/search.js` / `src/search-worker.js` — búsqueda de catálogo en Web Worker.
- `src/views/` — pantallas: login, faltantes, pedidos, usuarios.
- `src/app.js` — navegación y orquestación.

## Próximas fases

- Importar el catálogo real de productos desde el facturador (Excel/CSV).
- Gestión de proveedores y relación producto-proveedor.
- Importación de facturas y recomendaciones de compra.

Diagnóstico, diseño funcional y plan completo en `docs/modulo-faltantes.md`.
