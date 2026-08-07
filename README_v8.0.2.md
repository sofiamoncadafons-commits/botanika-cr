# Botanika CR v8.0.2 — Carrito Premium 2.0

## Objetivo de esta versión
Elevar la experiencia del carrito, especialmente en teléfonos, sin modificar el tamaño ni la proporción de las tarjetas del catálogo o de los combos.

## Cambios incluidos
- Resumen comercial del carrito con **Subtotal**, **Ahorro** y **Total**.
- El ahorro se calcula automáticamente para combos y productos con precio anterior.
- Los combos se identifican dentro del carrito con una insignia discreta **Combo Botanika**.
- Cada línea muestra su subtotal y, cuando aplica, el ahorro obtenido.
- Nuevo acceso a **Compra con Confianza** desde el carrito.
- La política de confianza cierra primero el carrito para evitar superposiciones.
- Mejor jerarquía visual de precios y acciones.
- Mejoras mobile-first con `100dvh`, safe-area y pie del carrito optimizado para iPhone.
- Se mantiene el flujo **Continuar por WhatsApp** y toda la lógica actual de cantidades y eliminación.
- No se modificó el tamaño de las tarjetas del catálogo ni de los combos.

## Archivos modificados
- `index.html`
- `assets/css/styles.css`
- `assets/js/main.js`
- `service-worker.js`

## Configuración preservada
`assets/js/supabase-config.js` se conserva exactamente como estaba en la versión base.

## Instalación
1. Haga una copia de respaldo de la versión actual.
2. Copie el contenido de esta versión sobre la carpeta del proyecto.
3. Reemplace los archivos existentes.
4. Reinicie Live Server.
5. Use `Ctrl + F5` en escritorio; en iPhone cierre y vuelva a abrir Safari si conserva caché anterior.
6. Pruebe el carrito agregando un producto normal y un combo para visualizar el cálculo de ahorro.
