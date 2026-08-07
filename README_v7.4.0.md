# Botanika CR v7.4.0 — Modal premium responsive

## Objetivo
Rediseñar el modal de detalle del producto para integrarlo visualmente con la identidad de Botanika y mejorar especialmente la experiencia en teléfonos celulares.

## Cambios de esta versión
- Nuevo diseño del modal con proporción más equilibrada entre fotografía e información.
- Imagen principal con `object-fit: contain` para evitar recortes y espacios visuales innecesarios.
- Botón de ampliar convertido en una acción circular discreta sobre la fotografía.
- Galería de miniaturas más compacta.
- Identidad visual Botanika reforzada con verde grisáceo, crema y rosa empolvado.
- Precio y disponibilidad con jerarquía visual más limpia.
- Tonos y variantes en controles compactos.
- Beneficios de confianza reorganizados para ocupar menos altura.
- Botones "Agregar al carrito" y "Consultar por WhatsApp" rediseñados y visibles durante el desplazamiento.
- Integración más discreta de "Compra con confianza".
- Productos relacionados compactos y desplazables horizontalmente en móvil.
- Modal optimizado para iPhone, Android, tablet y escritorio usando `100dvh` y `safe-area-inset`.
- Eliminación de decoraciones/pseudoelementos de la zona superior de la imagen que podían producir líneas o sombras no deseadas.

## Archivos modificados
- `assets/css/styles.css`
- `index.html`
- `service-worker.js`

## Archivos de configuración
No se modificó `assets/js/supabase-config.js` ni las configuraciones SQL/Supabase existentes.

## Instalación
1. Haga una copia de respaldo de la versión actual.
2. Copie el contenido de esta versión sobre la carpeta del proyecto.
3. Confirme el reemplazo de los archivos existentes.
4. Detenga y vuelva a iniciar Live Server.
5. En Windows use `Ctrl + F5` para forzar la actualización.
6. En iPhone cierre Safari completamente y vuelva a abrir el sitio si conserva la versión anterior.

## Validaciones sugeridas
- Abrir detalle de un producto con una sola imagen.
- Abrir un producto con galería y cambiar miniaturas.
- Abrir un producto con tonos/colores.
- Probar Ampliar imagen.
- Agregar al carrito desde el modal.
- Consultar por WhatsApp.
- Abrir Compra con Confianza desde el modal.
- Probar en iPhone en orientación vertical.
- Probar en una pantalla de escritorio.
