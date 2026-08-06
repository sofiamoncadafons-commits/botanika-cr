# Botanika CR v7.1.0

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


## Importación desde Excel (v7.1.0)

1. Entre al panel y abra **Importar catálogo**.
2. Descargue `Plantilla_Importacion_Botanika_v7.1.xlsx`.
3. Complete las hojas **Productos**, **Combos** y **ProductosCombo**.
4. Seleccione el archivo en el panel y presione **Validar archivo**.
5. Revise la vista previa y corrija cualquier error.
6. Seleccione si desea actualizar por ID o crear solamente registros nuevos.
7. Presione **Importar registros válidos**.

La importación no elimina registros ausentes del Excel. Los productos y combos se identifican por su columna `id`. Las imágenes deben indicarse como ruta existente o URL pública; el Excel no carga archivos de imagen incrustados.
