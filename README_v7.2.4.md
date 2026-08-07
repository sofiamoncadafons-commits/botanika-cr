# Botanika CR v7.2.4

## Objetivo de esta versión
Simplificar las acciones del carrusel y eliminar la duplicidad entre **Ver catálogo** y **Ver productos**.

## Cambios realizados
- Se eliminó el botón **Ver catálogo** de la primera diapositiva.
- Se conserva únicamente **Ver productos**, que limpia los filtros y muestra todo el catálogo.
- Se mantienen **Ver productos nuevos / Ver todo** en la diapositiva de novedades.
- Se mantienen **Ver destacados / Explorar catálogo** en la diapositiva de destacados, porque realizan acciones diferentes.
- Se redujo ligeramente el espacio entre botones del carrusel.
- Los botones del carrusel tienen altura y ancho visual consistentes en escritorio y móvil.
- Se actualizó la versión de caché a `v7.2.4`.

## Archivos modificados
- `index.html`
- `assets/css/styles.css`
- `service-worker.js`

## Instalación
1. Haga una copia de respaldo de la versión actual.
2. Copie el contenido de esta versión sobre la carpeta del proyecto.
3. Reemplace los archivos existentes.
4. Reinicie Live Server.
5. Presione `Ctrl + F5` en escritorio. En iPhone, cierre Safari y vuelva a abrir el sitio si mantiene una versión en caché.

## Validación esperada
- Primera diapositiva: solo aparece **Ver productos**.
- Novedades: **Ver productos nuevos** filtra novedades y **Ver todo** muestra todo el catálogo.
- Destacados: **Ver destacados** filtra destacados y **Explorar catálogo** muestra todo el catálogo.
