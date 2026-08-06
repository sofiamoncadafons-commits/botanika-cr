# Botanika CR v7.1.0 — Importación desde Excel

Esta versión agrega carga masiva desde Excel al panel administrativo.

## Incluye

- Plantilla Excel descargable con hojas Productos, Combos y ProductosCombo.
- Validación previa y vista previa.
- Importación por ID con actualización o solo creación.
- Importación de banderas: disponible, nuevo, destacado y oferta.
- Importación de colores, galería, beneficios y productos de combos.
- Reporte CSV de errores.
- Importación parcial: las filas válidas se pueden guardar y las inválidas se omiten.
- Conserva la importación desde JSON.

## Instalación

Reemplace los archivos del proyecto por esta versión. No hay cambios nuevos en el esquema SQL, por lo que no necesita volver a ejecutar `01_schema_seguridad.sql` si v7.0.0 ya funciona.

Abra `/admin/`, entre a **Importar catálogo**, descargue la plantilla, complétela y valide el archivo antes de importar.
