# PEDIDOS ALVARO

App interna para reemplazar el cuaderno físico de faltantes de una ferretería/retail y preparar pedidos por proveedor sin construir un ERP pesado.

## Qué incluye esta versión

- App web responsive instalable como PWA básica.
- Catálogo operativo generado con **8.200 productos** para validar volumen realista.
- Búsqueda rápida por nombre oficial, alias, marca, categoría, código interno, código de barras y proveedor.
- Búsqueda en `Web Worker` para no bloquear la interfaz en celulares.
- Persistencia local robusta en `IndexedDB` para soportar muchas operaciones de faltantes.
- Registro de faltantes clasificados o pendientes de clasificar.
- Lista filtrable por texto, estado y urgencia.
- Métricas operativas: total, pendientes, urgentes y sin clasificar.

## Ejecutar la app

Por seguridad de los navegadores con módulos y workers, abrirla con un servidor estático:

```bash
python3 -m http.server 4173 -d src
```

Luego entrar a:

```text
http://localhost:4173
```

## Probar

```bash
npm test
```

## Documentación

- `docs/modulo-faltantes.md`: diagnóstico, diseño funcional, diseño de datos y plan por fases.
- `docs/database-schema.sql`: esquema SQL propuesto para backend futuro.
