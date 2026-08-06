# Botanika CR v7.0.0 — Instalación del panel administrativo

Esta versión agrega un panel privado para administrar el catálogo desde el navegador:

- crear, editar y eliminar productos;
- cambiar precios, disponibilidad y prioridad;
- marcar productos como **Novedad**, **Destacado** u **Oferta**;
- subir o sustituir fotografías;
- crear, editar y eliminar combos;
- seleccionar los productos y cantidades de cada combo;
- importar el catálogo actual desde `productos.json` y `combos.json`.

El sitio público continúa funcionando en GitHub Pages. Si Supabase todavía no está configurado, utiliza automáticamente los archivos JSON como respaldo.

---

## 1. Crear el proyecto en Supabase

1. Ingrese a Supabase y cree una cuenta.
2. Seleccione **New project**.
3. Elija una organización o cree una.
4. Escriba un nombre, por ejemplo:

   `botanika-cr`

5. Cree una contraseña segura para la base de datos y guárdela.
6. Seleccione una región cercana.
7. Espere a que el proyecto termine de crearse.

---

## 2. Crear las tablas, reglas de seguridad y almacenamiento

1. Dentro del proyecto de Supabase, abra **SQL Editor**.
2. Seleccione **New query**.
3. Abra en VS Code este archivo del proyecto:

   `supabase/01_schema_seguridad.sql`

4. Copie todo su contenido.
5. Péguelo en SQL Editor.
6. Presione **Run**.

El script crea:

- `admin_users`
- `products`
- `combos`
- `combo_items`
- políticas RLS de lectura pública y escritura administrativa;
- el bucket público `product-images`;
- políticas para que solo administradores suban o eliminen imágenes.

Debe aparecer un mensaje de ejecución exitosa.

---

## 3. Crear el usuario administrador

1. En Supabase abra **Authentication**.
2. Entre en **Users**.
3. Seleccione **Add user** o **Create new user**.
4. Escriba el correo que utilizará para administrar Botanika.
5. Defina una contraseña segura.
6. Cree el usuario.
7. Abra ese usuario y copie su identificador UUID.

Ejemplo de UUID:

`3d87a6f4-12ab-4cde-8910-123456789abc`

---

## 4. Autorizar al usuario como administrador

1. Regrese a **SQL Editor**.
2. Abra el archivo:

   `supabase/02_autorizar_administrador.sql`

3. Sustituya:

   `EL-UUID-DEL-USUARIO`

   por el UUID copiado.

4. Ejecute la instrucción.

Ejemplo:

```sql
insert into public.admin_users (user_id)
values ('3d87a6f4-12ab-4cde-8910-123456789abc'::uuid)
on conflict (user_id) do nothing;
```

El inicio de sesión no permitirá administrar el catálogo hasta completar este paso.

---

## 5. Obtener la URL y la clave pública de Supabase

1. En Supabase abra **Project Settings**.
2. Entre en **API** o en la sección donde se muestran las claves del proyecto.
3. Copie:

   - **Project URL**
   - **Publishable key**

   En algunos proyectos la clave puede aparecer como **anon public key**.

No utilice la clave `service_role`, una secret key ni la contraseña de la base de datos dentro del sitio.

---

## 6. Configurar Botanika

Abra:

`assets/js/supabase-config.js`

Actualmente contiene valores de ejemplo:

```javascript
window.BOTANIKA_SUPABASE_CONFIG = {
  enabled: false,
  url: "https://SU-PROYECTO.supabase.co",
  publishableKey: "SU-PUBLISHABLE-KEY",
  storageBucket: "product-images"
};
```

Reemplácelos por los datos de su proyecto y cambie `enabled` a `true`:

```javascript
window.BOTANIKA_SUPABASE_CONFIG = {
  enabled: true,
  url: "https://xxxxxxxxxxxx.supabase.co",
  publishableKey: "sb_publishable_xxxxxxxxxxxxxxxxx",
  storageBucket: "product-images"
};
```

Guarde el archivo.

La publishable key o anon key puede estar en el navegador porque las operaciones están protegidas con autenticación y Row Level Security. Nunca coloque una secret key o `service_role` en este archivo.

---

## 7. Probar el panel localmente

1. Abra la carpeta de Botanika en VS Code.
2. Detenga Live Server si estaba ejecutándose.
3. Inicie Live Server nuevamente desde `index.html`.
4. En el navegador abra:

   `http://127.0.0.1:5500/admin/`

   El puerto podría ser distinto si Live Server usa otro.

5. Ingrese con el correo y la contraseña creados en Supabase.

Si aparece el mensaje de que el usuario no está autorizado, revise el paso 4.

---

## 8. Importar el catálogo actual

Al entrar por primera vez, la base de datos estará vacía.

1. En el menú del panel abra **Importar catálogo**.
2. Presione **Importar ahora**.
3. El panel leerá:

   - `assets/data/productos.json`
   - `assets/data/combos.json`

4. Los registros se crearán o actualizarán en Supabase.

La importación utiliza `upsert`: no crea duplicados cuando el identificador ya existe y no elimina registros adicionales de Supabase.

Las imágenes existentes continuarán usando sus rutas locales. Las nuevas fotografías que suba desde el panel se guardarán en Supabase Storage.

---

## 9. Confirmar que el catálogo público lee Supabase

1. Abra la página principal del sitio.
2. Presione `Ctrl + F5`.
3. Confirme que aparecen los productos y combos importados.
4. Desde el panel, cambie temporalmente el precio o marque un producto como **Novedad**.
5. Actualice la página pública.
6. El cambio debe aparecer sin modificar `productos.json`.

Si Supabase no responde, el sitio utiliza los JSON como respaldo para evitar que el catálogo quede vacío. Revise la consola del navegador para identificar el error de configuración.

---

## 10. Publicar en GitHub Pages

Cuando todo funcione localmente:

1. Abra GitHub Desktop.
2. Confirme que el repositorio seleccionado sea `botanika-cr`.
3. Revise los cambios.
4. Escriba como resumen:

   `Panel administrativo Botanika v7.0.0`

5. Presione **Commit to master**.
6. Presione **Push origin**.
7. Espere unos minutos.

El sitio público continuará en:

`https://sofiamoncadafons-commits.github.io/botanika-cr/`

El panel estará en:

`https://sofiamoncadafons-commits.github.io/botanika-cr/admin/`

La dirección del panel puede ser conocida públicamente, pero solo un usuario autenticado y registrado en `admin_users` podrá modificar información.

---

## 11. Uso diario

### Crear un producto

1. Abra **Productos**.
2. Presione **Agregar producto**.
3. Complete nombre, marca, categoría, precio y descripción.
4. Seleccione una imagen o mantenga una ruta existente.
5. Active las opciones necesarias:

   - Disponible
   - Novedad
   - Destacado
   - Oferta

6. Presione **Guardar producto**.

### Cambiar precio o disponibilidad

1. Busque el producto.
2. Presione el botón de editar.
3. Cambie el precio o el estado.
4. Guarde.

### Eliminar un producto

1. Presione el ícono de eliminar.
2. Confirme la operación.

Si el producto está incluido en un combo, primero deberá retirarlo del combo. Esto evita dejar combos incompletos.

### Crear un combo

1. Abra **Combos**.
2. Presione **Crear combo**.
3. Complete nombre, precio especial, descripción e imagen.
4. Marque los productos incluidos.
5. Defina la cantidad de cada producto.
6. Guarde el combo.

El sitio calcula automáticamente el precio individual total y el ahorro.

---

## 12. Respaldo recomendado

Aunque Supabase guarda los datos, mantenga respaldos periódicos:

- conserve el ZIP de la versión anterior;
- realice commits descriptivos en GitHub;
- exporte datos desde Supabase antes de cambios grandes;
- no elimine todavía `productos.json` ni `combos.json`, porque funcionan como respaldo del catálogo público.

---

## Problemas comunes

### “Falta configurar Supabase”

Revise `assets/js/supabase-config.js`, los valores y `enabled: true`.

### “Invalid login credentials”

Revise correo y contraseña en **Authentication > Users**.

### “El usuario no está autorizado”

Ejecute `supabase/02_autorizar_administrador.sql` con el UUID correcto.

### No permite guardar o eliminar

Revise que `01_schema_seguridad.sql` se ejecutó completo y que el usuario está en `admin_users`.

### No permite subir una imagen

- confirme que el archivo pese menos de 6 MB;
- use JPG, PNG, WebP o GIF;
- confirme que existe el bucket `product-images`;
- revise las políticas de Storage.

### El catálogo público sigue mostrando los JSON

- confirme `enabled: true`;
- revise Project URL y publishable key;
- presione `Ctrl + F5`;
- revise la consola del navegador;
- cierre Safari completamente en iPhone y vuelva a abrirlo.
