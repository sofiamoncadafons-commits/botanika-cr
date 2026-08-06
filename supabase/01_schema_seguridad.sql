-- =============================================================
-- BOTANIKA CR v7.0.0
-- Base de datos, seguridad RLS y almacenamiento de imágenes
-- Ejecute este archivo completo en Supabase > SQL Editor.
-- =============================================================

create extension if not exists pgcrypto;

-- Administradores autorizados.
create table if not exists public.admin_users (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

create or replace function public.is_botanika_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.admin_users
    where user_id = auth.uid()
  );
$$;

revoke all on function public.is_botanika_admin() from public;
grant execute on function public.is_botanika_admin() to anon, authenticated;

create table if not exists public.products (
  id text primary key,
  name text not null,
  brand text not null default 'Botanika',
  category text not null,
  subcategory text not null default '',
  price numeric(12,2) not null default 0 check (price >= 0),
  currency text not null default 'CRC',
  description text not null default '',
  image_url text not null default '',
  available boolean not null default true,
  featured boolean not null default false,
  is_new boolean not null default false,
  offer boolean not null default false,
  priority integer not null default 100,
  colors jsonb not null default '[]'::jsonb,
  gallery jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists products_category_idx on public.products(category);
create index if not exists products_brand_idx on public.products(brand);
create index if not exists products_priority_idx on public.products(priority);
create index if not exists products_available_idx on public.products(available);

create table if not exists public.combos (
  id text primary key,
  name text not null,
  brand text not null default 'Botanika',
  category text not null default 'Combos Botanika',
  subcategory text not null default '',
  price numeric(12,2) not null default 0 check (price >= 0),
  currency text not null default 'CRC',
  description text not null default '',
  image_url text not null default '',
  available boolean not null default true,
  featured boolean not null default false,
  is_new boolean not null default false,
  offer boolean not null default false,
  priority integer not null default 100,
  label text not null default 'Combo Botanika',
  ideal_for jsonb not null default '[]'::jsonb,
  benefits jsonb not null default '[]'::jsonb,
  usage text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists combos_priority_idx on public.combos(priority);
create index if not exists combos_available_idx on public.combos(available);

create table if not exists public.combo_items (
  combo_id text not null references public.combos(id) on delete cascade,
  product_id text not null references public.products(id) on delete restrict,
  quantity integer not null default 1 check (quantity > 0),
  sort_order integer not null default 0,
  primary key (combo_id, product_id)
);

create index if not exists combo_items_product_idx on public.combo_items(product_id);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

 drop trigger if exists products_set_updated_at on public.products;
create trigger products_set_updated_at
before update on public.products
for each row execute function public.set_updated_at();

 drop trigger if exists combos_set_updated_at on public.combos;
create trigger combos_set_updated_at
before update on public.combos
for each row execute function public.set_updated_at();

-- Seguridad: lectura pública del catálogo; escritura solo para administradores.
alter table public.admin_users enable row level security;
alter table public.products enable row level security;
alter table public.combos enable row level security;
alter table public.combo_items enable row level security;

 drop policy if exists "Users read own admin membership" on public.admin_users;
create policy "Users read own admin membership"
on public.admin_users for select
to authenticated
using (user_id = auth.uid());

 drop policy if exists "Public read products" on public.products;
create policy "Public read products"
on public.products for select
to anon, authenticated
using (true);

 drop policy if exists "Admin insert products" on public.products;
create policy "Admin insert products"
on public.products for insert
to authenticated
with check ((select public.is_botanika_admin()));

 drop policy if exists "Admin update products" on public.products;
create policy "Admin update products"
on public.products for update
to authenticated
using ((select public.is_botanika_admin()))
with check ((select public.is_botanika_admin()));

 drop policy if exists "Admin delete products" on public.products;
create policy "Admin delete products"
on public.products for delete
to authenticated
using ((select public.is_botanika_admin()));

 drop policy if exists "Public read combos" on public.combos;
create policy "Public read combos"
on public.combos for select
to anon, authenticated
using (true);

 drop policy if exists "Admin insert combos" on public.combos;
create policy "Admin insert combos"
on public.combos for insert
to authenticated
with check ((select public.is_botanika_admin()));

 drop policy if exists "Admin update combos" on public.combos;
create policy "Admin update combos"
on public.combos for update
to authenticated
using ((select public.is_botanika_admin()))
with check ((select public.is_botanika_admin()));

 drop policy if exists "Admin delete combos" on public.combos;
create policy "Admin delete combos"
on public.combos for delete
to authenticated
using ((select public.is_botanika_admin()));

 drop policy if exists "Public read combo items" on public.combo_items;
create policy "Public read combo items"
on public.combo_items for select
to anon, authenticated
using (true);

 drop policy if exists "Admin insert combo items" on public.combo_items;
create policy "Admin insert combo items"
on public.combo_items for insert
to authenticated
with check ((select public.is_botanika_admin()));

 drop policy if exists "Admin update combo items" on public.combo_items;
create policy "Admin update combo items"
on public.combo_items for update
to authenticated
using ((select public.is_botanika_admin()))
with check ((select public.is_botanika_admin()));

 drop policy if exists "Admin delete combo items" on public.combo_items;
create policy "Admin delete combo items"
on public.combo_items for delete
to authenticated
using ((select public.is_botanika_admin()));

-- Permisos de API con RLS como control final.
grant usage on schema public to anon, authenticated;
grant select on public.products, public.combos, public.combo_items to anon, authenticated;
grant insert, update, delete on public.products, public.combos, public.combo_items to authenticated;
grant select on public.admin_users to authenticated;

-- Bucket público para fotografías del catálogo.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'product-images',
  'product-images',
  true,
  6291456,
  array['image/jpeg','image/png','image/webp','image/gif']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- Las imágenes son públicas para el catálogo.
 drop policy if exists "Public read product images" on storage.objects;
create policy "Public read product images"
on storage.objects for select
to public
using (bucket_id = 'product-images');

-- Solo administradores pueden cargar, sustituir o eliminar imágenes.
 drop policy if exists "Admin upload product images" on storage.objects;
create policy "Admin upload product images"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'product-images'
  and (select public.is_botanika_admin())
);

 drop policy if exists "Admin update product images" on storage.objects;
create policy "Admin update product images"
on storage.objects for update
to authenticated
using (
  bucket_id = 'product-images'
  and (select public.is_botanika_admin())
)
with check (
  bucket_id = 'product-images'
  and (select public.is_botanika_admin())
);

 drop policy if exists "Admin delete product images" on storage.objects;
create policy "Admin delete product images"
on storage.objects for delete
to authenticated
using (
  bucket_id = 'product-images'
  and (select public.is_botanika_admin())
);
