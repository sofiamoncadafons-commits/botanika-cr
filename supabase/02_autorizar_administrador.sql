-- PASO FINAL DE SEGURIDAD
-- 1. En Supabase vaya a Authentication > Users.
-- 2. Cree el usuario administrador con correo y contraseña.
-- 3. Copie el UUID del usuario.
-- 4. Reemplace EL-UUID-DEL-USUARIO y ejecute esta instrucción.

insert into public.admin_users (user_id)
values ('eedfe0df-43a1-4531-b8d7-6e1ebde70fca'::uuid)
on conflict (user_id) do nothing;
