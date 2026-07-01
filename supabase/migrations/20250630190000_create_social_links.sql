-- Footer social media links (per branch)
CREATE TABLE IF NOT EXISTS public.social_links (
  social_link_id SERIAL PRIMARY KEY,
  branch_id INTEGER NOT NULL REFERENCES public.branches (branch_id) ON DELETE CASCADE,
  platform VARCHAR(32) NOT NULL,
  url TEXT NOT NULL DEFAULT '',
  is_visible BOOLEAN NOT NULL DEFAULT TRUE,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT social_links_platform_check CHECK (
    platform IN (
      'linkedin',
      'facebook',
      'twitter',
      'youtube',
      'instagram',
      'snapchat',
      'tiktok',
      'email'
    )
  ),
  CONSTRAINT social_links_branch_platform_unique UNIQUE (branch_id, platform)
);

CREATE INDEX IF NOT EXISTS social_links_branch_visible_order_idx
  ON public.social_links (branch_id, is_visible, display_order);

CREATE OR REPLACE FUNCTION public.set_social_links_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS social_links_set_updated_at ON public.social_links;

CREATE TRIGGER social_links_set_updated_at
  BEFORE UPDATE ON public.social_links
  FOR EACH ROW
  EXECUTE FUNCTION public.set_social_links_updated_at();

ALTER TABLE public.social_links ENABLE ROW LEVEL SECURITY;

GRANT SELECT ON public.social_links TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.social_links TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE public.social_links_social_link_id_seq TO authenticated;

DROP POLICY IF EXISTS social_links_public_read ON public.social_links;
DROP POLICY IF EXISTS social_links_admin_read ON public.social_links;
DROP POLICY IF EXISTS social_links_branch_manager_read ON public.social_links;
DROP POLICY IF EXISTS social_links_admin_write ON public.social_links;
DROP POLICY IF EXISTS social_links_branch_manager_write ON public.social_links;

-- Public site: visible links only
CREATE POLICY social_links_public_read
  ON public.social_links
  FOR SELECT
  TO anon, authenticated
  USING (is_visible = TRUE);

-- Admins: read all links (including hidden) for management
CREATE POLICY social_links_admin_read
  ON public.social_links
  FOR SELECT
  TO authenticated
  USING (public.is_admin(auth.uid()));

-- Branch managers: read all links for their branch
CREATE POLICY social_links_branch_manager_read
  ON public.social_links
  FOR SELECT
  TO authenticated
  USING (public.is_branch_manager(auth.uid(), branch_id));

-- Admins: full write access
CREATE POLICY social_links_admin_write
  ON public.social_links
  FOR ALL
  TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

-- Branch managers: write their branch only
CREATE POLICY social_links_branch_manager_write
  ON public.social_links
  FOR ALL
  TO authenticated
  USING (public.is_branch_manager(auth.uid(), branch_id))
  WITH CHECK (public.is_branch_manager(auth.uid(), branch_id));
