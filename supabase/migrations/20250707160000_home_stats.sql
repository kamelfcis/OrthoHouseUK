-- Homepage statistics (per branch) and section visibility toggle
CREATE TABLE IF NOT EXISTS public.home_stats (
  home_stat_id SERIAL PRIMARY KEY,
  branch_id INTEGER NOT NULL REFERENCES public.branches (branch_id) ON DELETE CASCADE,
  stat_key VARCHAR(32) NOT NULL,
  stat_value INTEGER NOT NULL,
  stat_suffix VARCHAR(8) NOT NULL DEFAULT '',
  label VARCHAR(128) NOT NULL,
  icon VARCHAR(64),
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT home_stats_stat_key_check CHECK (
    stat_key IN ('employees', 'surgeons', 'hospitals', 'operations', 'partners', 'events')
  ),
  CONSTRAINT home_stats_branch_stat_key_unique UNIQUE (branch_id, stat_key)
);

CREATE INDEX IF NOT EXISTS home_stats_branch_order_idx
  ON public.home_stats (branch_id, display_order);

CREATE OR REPLACE FUNCTION public.set_home_stats_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS home_stats_set_updated_at ON public.home_stats;

CREATE TRIGGER home_stats_set_updated_at
  BEFORE UPDATE ON public.home_stats
  FOR EACH ROW
  EXECUTE FUNCTION public.set_home_stats_updated_at();

ALTER TABLE public.home_stats ENABLE ROW LEVEL SECURITY;

GRANT SELECT ON public.home_stats TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.home_stats TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE public.home_stats_home_stat_id_seq TO authenticated;

DROP POLICY IF EXISTS home_stats_public_read ON public.home_stats;
DROP POLICY IF EXISTS home_stats_admin_read ON public.home_stats;
DROP POLICY IF EXISTS home_stats_branch_manager_read ON public.home_stats;
DROP POLICY IF EXISTS home_stats_admin_write ON public.home_stats;
DROP POLICY IF EXISTS home_stats_branch_manager_write ON public.home_stats;

CREATE POLICY home_stats_public_read
  ON public.home_stats
  FOR SELECT
  TO anon, authenticated
  USING (TRUE);

CREATE POLICY home_stats_admin_read
  ON public.home_stats
  FOR SELECT
  TO authenticated
  USING (public.is_admin(auth.uid()));

CREATE POLICY home_stats_branch_manager_read
  ON public.home_stats
  FOR SELECT
  TO authenticated
  USING (public.is_branch_manager(auth.uid(), branch_id));

CREATE POLICY home_stats_admin_write
  ON public.home_stats
  FOR ALL
  TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY home_stats_branch_manager_write
  ON public.home_stats
  FOR ALL
  TO authenticated
  USING (public.is_branch_manager(auth.uid(), branch_id))
  WITH CHECK (public.is_branch_manager(auth.uid(), branch_id));

-- Extend nav_link_settings for homepage stats section visibility
ALTER TABLE public.nav_link_settings
  DROP CONSTRAINT IF EXISTS nav_link_settings_nav_key_check;

ALTER TABLE public.nav_link_settings
  ADD CONSTRAINT nav_link_settings_nav_key_check CHECK (
    nav_key IN (
      'partners',
      'blog',
      'home_specialties',
      'home_featured_products',
      'home_resources',
      'home_stats'
    )
  );

-- Seed UK branch: stats section hidden by default
INSERT INTO public.nav_link_settings (branch_id, nav_key, is_visible, display_order)
VALUES (2, 'home_stats', FALSE, 40)
ON CONFLICT (branch_id, nav_key) DO NOTHING;

-- Seed UK branch default stat values
INSERT INTO public.home_stats (branch_id, stat_key, stat_value, stat_suffix, label, icon, display_order)
VALUES
  (2, 'employees', 25, '', 'Employees', 'fa-users-gear', 1),
  (2, 'surgeons', 100, '+', 'Surgeons supported', 'fa-user-doctor', 2),
  (2, 'hospitals', 75, '+', 'Partner hospitals', 'fa-hospital', 3),
  (2, 'operations', 80, '+', 'Theatre cases supported daily', 'fa-heart-pulse', 4),
  (2, 'partners', 10, '+', 'Manufacturing partners', 'fa-handshake', 5),
  (2, 'events', 20, '+', 'Education events per year', 'fa-calendar-days', 6)
ON CONFLICT (branch_id, stat_key) DO NOTHING;
