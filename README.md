# Botanika CR v7.0.0

Versión con panel administrativo dinámico basado en Supabase.

## Accesos

- Catálogo público: `index.html`
- Panel administrativo: `admin/index.html`
- Configuración: `assets/js/supabase-config.js`
- Instalación: `INSTALACION_PANEL_ADMIN.md`
- SQL de base y seguridad: `supabase/01_schema_seguridad.sql`
- Autorización del administrador: `supabase/02_autorizar_administrador.sql`

## Funcionamiento de respaldo

Mientras Supabase no esté configurado o si ocurre un error de conexión, el catálogo público intenta cargar `assets/data/productos.json` y `assets/data/combos.json`.
