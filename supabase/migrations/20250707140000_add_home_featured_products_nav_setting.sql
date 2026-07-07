-- Extend nav_link_settings to support featured products homepage section toggle
ALTER TABLE public.nav_link_settings
  DROP CONSTRAINT IF EXISTS nav_link_settings_nav_key_check;

ALTER TABLE public.nav_link_settings
  ADD CONSTRAINT nav_link_settings_nav_key_check CHECK (
    nav_key IN ('partners', 'blog', 'home_specialties', 'home_featured_products')
  );

-- Seed UK branch: featured products visible by default (matches current homepage)
INSERT INTO public.nav_link_settings (branch_id, nav_key, is_visible, display_order)
VALUES (2, 'home_featured_products', TRUE, 20)
ON CONFLICT (branch_id, nav_key) DO NOTHING;
