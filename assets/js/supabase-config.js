/*
  BOTANIKA CR - CONFIGURACIÓN SUPABASE

  1. Cree un proyecto en Supabase.
  2. Copie Project URL y Publishable key (o anon key).
  3. Reemplace los valores siguientes.
  4. Cambie enabled a true.

  IMPORTANTE:
  - La clave pública sí puede estar en el navegador cuando RLS está activo.
  - Nunca coloque aquí la service_role key ni una secret key.
*/
window.BOTANIKA_SUPABASE_CONFIG = {
  enabled: false,
  url: "https://SU-PROYECTO.supabase.co",
  publishableKey: "SU-PUBLISHABLE-KEY",
  storageBucket: "product-images"
};
