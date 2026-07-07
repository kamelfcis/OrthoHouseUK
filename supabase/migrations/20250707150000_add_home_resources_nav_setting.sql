-- Extend nav_link_settings to support homepage blog/resources section toggle
ALTER TABLE public.nav_link_settings
  DROP CONSTRAINT IF EXISTS nav_link_settings_nav_key_check;

ALTER TABLE public.nav_link_settings
  ADD CONSTRAINT nav_link_settings_nav_key_check CHECK (
    nav_key IN (
      'partners',
      'blog',
      'home_specialties',
      'home_featured_products',
      'home_resources'
    )
  );

-- Seed UK branch: blog/resources section visible by default (matches current homepage)
INSERT INTO public.nav_link_settings (branch_id, nav_key, is_visible, display_order)
VALUES (2, 'home_resources', TRUE, 30)
ON CONFLICT (branch_id, nav_key) DO NOTHING;
