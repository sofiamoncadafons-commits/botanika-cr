# Botanika CR v8.0.7

## Objetivo de esta versión
Refinar los dos botones principales del modal de detalle para que tengan una proporción más elegante y equilibrada.

## Cambios
- `Agregar al carrito` y `Consultar por WhatsApp` ahora se muestran a la par.
- Ambos botones tienen exactamente el mismo ancho y la misma altura.
- Se redujo su tamaño visual para que no dominen el modal.
- El botón de carrito mantiene el verde Botanika como acción principal.
- WhatsApp utiliza una variante secundaria clara con borde verde.
- Se ajustaron tipografía, iconos, padding y radios de borde.
- En móviles ambos botones permanecen lado a lado y se adaptan al ancho disponible.
- En pantallas muy estrechas se permite el ajuste del texto dentro del botón sin recortarlo.

## Archivos modificados
- `assets/css/styles.css`
- `index.html` (versión de recursos)
- `service-worker.js` (versión de caché)

## No modificado
- Tamaño y proporción de las tarjetas del catálogo.
- Datos de productos y combos.
- Panel administrativo.
- Configuración de Supabase.

## Instalación
1. Realice una copia de respaldo de la versión actual.
2. Copie el contenido de esta versión sobre la carpeta del proyecto.
3. Reemplace los archivos existentes.
4. Reinicie Live Server.
5. Presione `Ctrl + F5` para forzar la actualización de estilos.
6. En iPhone, cierre Safari completamente y vuelva a abrir el sitio si conserva estilos anteriores.
