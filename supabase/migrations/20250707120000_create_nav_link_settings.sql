-- Navbar/footer link visibility (per branch)
CREATE TABLE IF NOT EXISTS public.nav_link_settings (
  nav_link_setting_id SERIAL PRIMARY KEY,
  branch_id INTEGER NOT NULL REFERENCES public.branches (branch_id) ON DELETE CASCADE,
  nav_key VARCHAR(32) NOT NULL,
  is_visible BOOLEAN NOT NULL DEFAULT FALSE,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT nav_link_settings_nav_key_check CHECK (
    nav_key IN ('partners', 'blog')
  ),
  CONSTRAINT nav_link_settings_branch_nav_key_unique UNIQUE (branch_id, nav_key)
);

CREATE INDEX IF NOT EXISTS nav_link_settings_branch_order_idx
  ON public.nav_link_settings (branch_id, display_order);

CREATE OR REPLACE FUNCTION public.set_nav_link_settings_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS nav_link_settings_set_updated_at ON public.nav_link_settings;

CREATE TRIGGER nav_link_settings_set_updated_at
  BEFORE UPDATE ON public.nav_link_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.set_nav_link_settings_updated_at();

ALTER TABLE public.nav_link_settings ENABLE ROW LEVEL SECURITY;

GRANT SELECT ON public.nav_link_settings TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.nav_link_settings TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE public.nav_link_settings_nav_link_setting_id_seq TO authenticated;

DROP POLICY IF EXISTS nav_link_settings_public_read ON public.nav_link_settings;
DROP POLICY IF EXISTS nav_link_settings_admin_read ON public.nav_link_settings;
DROP POLICY IF EXISTS nav_link_settings_branch_manager_read ON public.nav_link_settings;
DROP POLICY IF EXISTS nav_link_settings_admin_write ON public.nav_link_settings;
DROP POLICY IF EXISTS nav_link_settings_branch_manager_write ON public.nav_link_settings;

-- Public site: read all rows (client filters by is_visible)
CREATE POLICY nav_link_settings_public_read
  ON public.nav_link_settings
  FOR SELECT
  TO anon, authenticated
  USING (TRUE);

-- Admins: read all settings for management
CREATE POLICY nav_link_settings_admin_read
  ON public.nav_link_settings
  FOR SELECT
  TO authenticated
  USING (public.is_admin(auth.uid()));

-- Branch managers: read settings for their branch
CREATE POLICY nav_link_settings_branch_manager_read
  ON public.nav_link_settings
  FOR SELECT
  TO authenticated
  USING (public.is_branch_manager(auth.uid(), branch_id));

-- Admins: full write access
CREATE POLICY nav_link_settings_admin_write
  ON public.nav_link_settings
  FOR ALL
  TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

-- Branch managers: write their branch only
CREATE POLICY nav_link_settings_branch_manager_write
  ON public.nav_link_settings
  FOR ALL
  TO authenticated
  USING (public.is_branch_manager(auth.uid(), branch_id))
  WITH CHECK (public.is_branch_manager(auth.uid(), branch_id));

-- Seed UK branch: partners and blog hidden by default
INSERT INTO public.nav_link_settings (branch_id, nav_key, is_visible, display_order)
VALUES
  (2, 'partners', FALSE, 1),
  (2, 'blog', FALSE, 2)
ON CONFLICT (branch_id, nav_key) DO NOTHING;
