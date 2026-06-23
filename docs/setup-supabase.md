# Puesta en marcha — Pedidos Alvaro

Esta guía te lleva de la app en "modo demostración" a una app **real, compartida entre todos tus empleados**, con login. No hace falta saber programar: es copiar, pegar y hacer clics.

> **¿Qué es el modo demostración?** Si no configurás nada, la app igual funciona, pero los datos se guardan solo en el celular/PC donde la abrís y no se comparten. Sirve para probar. Para usarla en serio, seguí estos pasos.

---

## Paso 1 — Crear el proyecto en Supabase (gratis)

1. Entrá a **https://supabase.com** y creá una cuenta (podés usar tu Google).
2. Clic en **New project**.
3. Ponele un nombre (ej: `pedidos-alvaro`), elegí una contraseña para la base de datos (guardala) y la región más cercana.
4. Esperá 1–2 minutos a que el proyecto quede listo.

## Paso 2 — Crear las tablas

1. En el menú izquierdo, entrá a **SQL Editor**.
2. Abrí el archivo `supabase/schema.sql` de este proyecto, **copiá todo su contenido** y pegalo en el editor.
3. Clic en **Run**. Debe decir *Success*. Listo: ya tenés la base de datos.

## Paso 3 — Conectar la app con tu proyecto

1. En Supabase, andá a **Project Settings → API**.
2. Copiá dos datos:
   - **Project URL** (algo como `https://abcd1234.supabase.co`)
   - **anon public** (una clave larga)
3. Abrí el archivo `src/config.js` y pegalos entre las comillas:

   ```js
   export const SUPABASE_URL = 'https://abcd1234.supabase.co';
   export const SUPABASE_ANON_KEY = 'la-clave-anon-public';
   export const BUSINESS_NAME = 'Mi Ferretería';
   ```

4. Guardá el archivo. La app ahora deja el modo demostración y usa la base real.

## Paso 4 — Crear tu usuario y volverte administrador

1. Abrí la app y entrá a **Crear cuenta**: poné tu nombre, email y contraseña.
   - Por defecto Supabase pide confirmar el email. Revisá tu correo y confirmá.
   - (Opcional, para no confirmar emails al inicio: en Supabase **Authentication → Providers → Email**, desactivá *Confirm email*.)
2. Cerrá sesión y volvé a entrar en la app. Si todavía no existe ningún administrador activo, la app convierte automáticamente tu cuenta en **administrador** y ves la pestaña **Usuarios**.

> Si antes tocaste la tabla y quedaste sin acceso, volvé a copiar y ejecutar el archivo completo `supabase/schema.sql` en Supabase → **SQL Editor**. Después iniciá sesión otra vez. Si necesitás corregirlo manualmente, ejecutá este SQL cambiando el email por el tuyo:
>
> ```sql
> update public.profiles
>    set role = 'administrador', active = true
>  where id = (select id from auth.users where email = 'tu-email@ejemplo.com');
> ```

## Paso 5 — Sumar a tus empleados

1. Cada empleado entra a la app y se crea su cuenta.
2. Desde la pestaña **Usuarios** (solo vos como admin) les asignás el rol:
   - **Encargado:** cambia estados y arma pedidos.
   - **Trabajador:** registra faltantes.

---

## Paso 6 — Publicar la app en internet (para que la usen desde el celular)

La app son archivos estáticos (la carpeta `src/`). La forma más fácil y gratuita:

### Opción A — Netlify (arrastrar y soltar)
1. Entrá a **https://app.netlify.com/drop**.
2. Arrastrá la carpeta `src/` a la página.
3. Te da un link público (ej: `https://pedidos-alvaro.netlify.app`). Ese link lo abrís desde cualquier celular y, en el navegador, "Agregar a pantalla de inicio" para que quede como una app.

### Opción B — Conectar con GitHub (se actualiza solo)
En Netlify o Vercel: "Import from Git", elegí este repositorio y poné como carpeta de publicación `src`. Cada cambio que subas se publica automáticamente.

---

## Preguntas frecuentes

- **¿Cuánto cuesta?** El plan gratis de Supabase y de Netlify alcanza de sobra para una ferretería. Si algún día crece mucho, se pasa a un plan pago bajo.
- **¿Pierdo los datos del modo demostración al conectar Supabase?** Sí, esos eran solo de prueba en tu dispositivo. Los datos reales empiezan desde Supabase.
## Importar tu catálogo real

La app trae un catálogo de ejemplo solo para probar. Para cargar tus productos reales:

1. Entrá como **administrador** y abrí la pestaña **Catálogo**.
2. En tu sistema actual, seleccioná la lista de productos y **copiala** (o exportá un CSV).
3. **Pegá** las filas en el recuadro (o subí el archivo CSV) y tocá **Analizar datos**.
4. La app detecta sola las columnas (Descripción, Marca, Precio venta, Unidad, Stock). Revisá que estén bien con los menús desplegables.
5. Tocá **Importar**. Listo: el buscador de faltantes ya usa tus productos reales con su precio.

> Solo se necesita Descripción, Marca y Precio de venta. El precio de compra no hace falta.
