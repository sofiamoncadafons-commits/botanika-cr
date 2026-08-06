# Botanika CR v7.2.0 — Exportación del catálogo

Esta liberación agrega únicamente la opción administrativa para exportar los datos actuales de Supabase.

## Archivos modificados

- `admin/index.html`
- `admin/admin.js`
- `admin/admin.css`
- `service-worker.js`

## Funcionalidad nueva

En el menú administrativo se agregó **Exportar catálogo**.

### Exportar Excel

Genera un archivo `.xlsx` con estas hojas:

- `Resumen`
- `Productos`
- `Combos`
- `ProductosCombo`

Las tres hojas de datos son compatibles con la opción existente **Importar catálogo**. Puede exportar, editar el Excel, validarlo y volverlo a importar.

### Exportar respaldo JSON

Genera un archivo `.json` con productos, combos y relaciones. Se recomienda conservarlo como respaldo técnico antes de cargas masivas.

## Instalación

1. Haga una copia de seguridad del proyecto actual.
2. Copie el contenido de esta versión sobre la carpeta del proyecto.
3. Confirme el reemplazo de archivos.
4. Reinicie Live Server.
5. Abra `/admin/` y seleccione **Exportar catálogo**.
6. Presione `Ctrl + F5` si el navegador conserva la versión anterior.

Los valores existentes de `assets/js/supabase-config.js` se conservaron sin cambios.
