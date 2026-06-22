# Módulo operativo de faltantes y pedidos por proveedor

## A. Diagnóstico técnico inicial

### Qué existe actualmente

El repositorio actual está prácticamente vacío: solo contiene la configuración de Git y un archivo `.gitkeep`. No hay aplicación, framework, base de datos, autenticación, módulos de productos, usuarios, proveedores, compras ni inventario implementados dentro de este repositorio.

### Qué se puede reutilizar

Al no existir código de aplicación en este repositorio, no hay componentes técnicos reutilizables. Sí se puede reutilizar el concepto operativo existente de la empresa:

- El facturador es la fuente de productos oficiales.
- El cuaderno de faltantes define el flujo real que debe digitalizarse primero.
- Las facturas Excel serán la fuente progresiva para aprender relaciones producto-proveedor.

### Qué falta crear

Para resolver el problema sin construir un ERP completo se necesita crear un módulo operativo liviano con estas piezas:

- Catálogo de productos oficiales importable o sincronizable desde el facturador.
- Alias por producto para resolver búsquedas con nombres comunes del equipo.
- Registro móvil rápido de faltantes.
- Lista general filtrable de faltantes.
- Base preparada para proveedores y relación producto-proveedor.
- Estructura posterior para pedidos, importaciones Excel e historial.

### Riesgos principales

- **Calidad del catálogo oficial:** si los nombres del facturador son incompletos o inconsistentes, la búsqueda requerirá alias y limpieza gradual.
- **Adopción operativa:** si el flujo móvil tiene demasiados campos, el equipo volverá al cuaderno.
- **Duplicidad de productos:** los pendientes de clasificar deben revisarse frecuentemente para evitar productos duplicados.
- **Integración futura con facturador:** se debe confirmar si el facturador exporta productos, códigos, marcas y códigos de barra.
- **Datos de proveedores:** la relación producto-proveedor será incompleta al inicio y mejorará con facturas Excel.

## B. Diseño funcional del módulo

### Principio operativo

El sistema no reemplaza el inventario completo. Reemplaza primero el cuaderno de faltantes con un flujo simple:

**Faltante detectado → búsqueda de producto oficial/alias → registro rápido → revisión del encargado → preparación futura por proveedor.**

### Flujo trabajador

1. Abre la app desde el celular.
2. Busca el producto por nombre oficial, alias, marca, categoría, código, código de barras o proveedor asociado.
3. Selecciona el producto sugerido.
4. Ingresa cantidad aproximada.
5. Marca urgencia.
6. Agrega observación opcional solo si hace falta.
7. Guarda.

Si no encuentra el producto, registra un faltante pendiente de clasificar con el texto escrito.

### Flujo encargado

1. Revisa todos los faltantes pendientes.
2. Filtra por estado, urgencia, usuario, local o búsqueda de texto.
3. Cambia estados: pendiente, revisado, pedido, recibido o cancelado.
4. En fases posteriores, agrupa por proveedor y confirma pedidos.

### Flujo administrador

1. Gestiona productos oficiales y alias.
2. Revisa faltantes pendientes de clasificar.
3. Vincula alias con productos oficiales.
4. En fases posteriores, importa facturas Excel y valida relaciones producto-proveedor.

### Pantallas necesarias

- **Registrar faltante:** pantalla móvil prioritaria para trabajadores.
- **Faltantes:** lista general con filtros y cambios de estado.
- **Productos y alias:** administración simple del catálogo operativo.
- **Proveedores:** base inicial preparada para fases 2 y 3.
- **Proveedor vendedor:** pantalla futura para seleccionar proveedor y ver faltantes que puede vender.
- **Importar facturas Excel:** pantalla futura para cargar facturas y vincular productos.

### Roles

- **Administrador:** productos, alias, proveedores, importación Excel, vinculación, historial y preferencias.
- **Encargado:** revisión, armado de pedidos, confirmación y recepción.
- **Trabajador:** registro rápido y consulta básica.

### Estados de faltante

- `pendiente`: recién registrado.
- `revisado`: validado por encargado.
- `pedido`: incluido en un pedido.
- `recibido`: producto recibido.
- `cancelado`: no corresponde pedir.

### Casos de uso clave

- Registrar faltante con producto oficial.
- Registrar faltante pendiente de clasificar.
- Buscar productos por alias.
- Revisar y filtrar faltantes.
- Cambiar estado de un faltante.
- Preparar la base para proveedor múltiple por producto.

## C. Diseño de base de datos propuesto

Los nombres están pensados en inglés para mantener compatibilidad técnica y claridad. Si en el futuro se integra con una base existente, deben adaptarse al estándar real del proyecto.

### `products`

Productos oficiales provenientes del facturador.

- `id`
- `official_name`
- `brand`
- `category`
- `internal_code`
- `barcode`
- `unit`
- `active`
- `created_at`
- `updated_at`

### `product_aliases`

Alias o nombres alternativos usados por trabajadores o proveedores.

- `id`
- `product_id`
- `alias`
- `source`: manual, invoice, worker_search
- `created_by`
- `created_at`

### `suppliers`

Proveedores.

- `id`
- `name`
- `contact_name`
- `phone`
- `whatsapp`
- `email`
- `active`
- `created_at`
- `updated_at`

### `product_suppliers`

Relación muchos-a-muchos entre productos y proveedores.

- `id`
- `product_id`
- `supplier_id`
- `supplier_product_code`
- `supplier_product_name`
- `last_price`
- `last_purchase_date`
- `preferred`
- `lead_time_days`
- `notes`
- `created_at`
- `updated_at`

### `shortage_requests`

Registro del cuaderno digital de faltantes.

- `id`
- `product_id` nullable
- `unclassified_text` nullable
- `quantity`
- `unit`
- `urgency`: baja, normal, alta
- `status`: pendiente, revisado, pedido, recibido, cancelado
- `notes`
- `location`
- `created_by`
- `created_at`
- `reviewed_by`
- `reviewed_at`

### `purchase_orders`

Pedidos a proveedor para fases posteriores.

- `id`
- `supplier_id`
- `status`: borrador, confirmado, enviado, recibido, cancelado
- `created_by`
- `confirmed_by`
- `confirmed_at`
- `notes`
- `created_at`
- `updated_at`

### `purchase_order_items`

Detalle de pedidos.

- `id`
- `purchase_order_id`
- `shortage_request_id` nullable
- `product_id`
- `quantity`
- `unit`
- `notes`
- `status`
- `created_at`

### `invoice_imports`

Cabecera de importaciones Excel.

- `id`
- `supplier_id`
- `invoice_number`
- `invoice_date`
- `file_name`
- `status`: cargado, procesado, requiere_revision
- `imported_by`
- `created_at`

### `invoice_import_rows`

Líneas crudas y normalizadas de cada Excel.

- `id`
- `invoice_import_id`
- `row_number`
- `raw_product_code`
- `raw_product_name`
- `quantity`
- `unit`
- `unit_price`
- `line_total`
- `matched_product_id` nullable
- `match_status`: vinculado, pendiente, descartado
- `created_at`

### `product_match_suggestions`

Sugerencias de vinculación entre textos externos y productos oficiales.

- `id`
- `invoice_import_row_id` nullable
- `shortage_request_id` nullable
- `candidate_product_id`
- `score`
- `reason`
- `accepted_by`
- `accepted_at`
- `created_at`

### `users` / `roles`

Si no existe autenticación, se recomienda iniciar simple:

- `users`: `id`, `name`, `email`, `role`, `active`, `created_at`
- Roles permitidos: `administrador`, `encargado`, `trabajador`

## D. Plan de implementación por fases

### Fase 1: Digitalizar cuaderno de faltantes

Objetivo: reemplazar el cuaderno físico sin complejidad.

Incluye:

- App móvil simple.
- Catálogo operativo de productos.
- Alias por producto.
- Registro rápido de faltantes.
- Pendientes de clasificar.
- Lista general con filtros.
- Estados básicos.
- Persistencia local inicial en el prototipo y estructura lista para backend.

### Fase 2: Agrupar faltantes por proveedor

Objetivo: que el encargado pueda ver faltantes por proveedor.

Incluye:

- Proveedores.
- Relación producto-proveedor.
- Vista por proveedor cuando llega un vendedor.
- Sugerencia inicial si hay proveedor único o preferido.
- Generación de texto para WhatsApp.
- Exportación simple.

### Fase 3: Importar facturas Excel

Objetivo: aprender progresivamente qué vende cada proveedor.

Incluye:

- Carga Excel.
- Mapeo de columnas.
- Vinculación automática tentativa.
- Cola de productos pendientes de vincular.
- Actualización de historial de compras y `product_suppliers`.

### Fase 4: Recomendaciones simples de proveedor

Objetivo: asistir la compra sin automatizar decisiones críticas.

Incluye:

- Proveedor preferido.
- Último proveedor usado.
- Último precio más bajo.
- Fecha de última compra.
- Tiempo aproximado de entrega.
- Reglas visibles y editables por administrador.

## E. Estrategia técnica aplicada en este repositorio

Como el repositorio no contiene una aplicación existente, la Fase 1 se implementa como una app web estática, responsive y sin dependencias externas. Esto permite validar el flujo operativo rápidamente desde celulares, sin introducir un ERP ni infraestructura pesada.

La app usa `localStorage` como persistencia de prototipo. En una siguiente iteración, las funciones de almacenamiento se pueden reemplazar por llamadas a una API sin rediseñar el flujo de usuario.
