-- =============================================================
-- BOTANIKA CR v8.0.3 - Consejo Botanika por producto
-- Ejecutar UNA VEZ en Supabase > SQL Editor antes de guardar
-- consejos personalizados desde el panel administrativo.
-- =============================================================

alter table public.products
  add column if not exists tip text not null default '';

comment on column public.products.tip is
  'Consejo breve de uso o aplicación mostrado en el detalle del producto.';
