# Botanika CR v7.3.1

## Objetivo
Corregir la diferencia visual de la opción **Compra con Confianza** en el menú principal.

## Cambios
- Se normalizó el elemento `button` usado por **Compra con Confianza** para que utilice la misma tipografía, peso, tamaño, espaciado y alineación que `Inicio`, `Catálogo` y `Contacto`.
- Se eliminan estilos nativos del navegador (`appearance`, borde, márgenes) que podían hacer que el botón se viera diferente, especialmente en Safari/iPhone.
- Se mantiene el comportamiento existente del modal **Compra con Confianza**.
- Se actualizó la versión de caché a `v7.3.1`.

## Archivos modificados
- `assets/css/styles.css`
- `index.html`
- `service-worker.js`

## Instalación
1. Haga una copia de respaldo de su proyecto actual.
2. Copie el contenido de esta versión sobre el proyecto y reemplace los archivos existentes.
3. Reinicie Live Server.
4. En computadora presione `Ctrl + F5`.
5. En iPhone cierre Safari completamente y vuelva a abrir el sitio si conserva estilos anteriores.
