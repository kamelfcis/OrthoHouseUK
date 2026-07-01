-- Partner portfolio PDF mappings and request audit log

CREATE TABLE IF NOT EXISTS public.partner_portfolio_files (
  portfolio_file_id SERIAL PRIMARY KEY,
  partner_id INTEGER NOT NULL REFERENCES public.partners (partner_id) ON DELETE CASCADE,
  storage_path TEXT NOT NULL,
  display_name TEXT NOT NULL,
  display_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT partner_portfolio_files_partner_path_unique UNIQUE (partner_id, storage_path)
);

CREATE INDEX IF NOT EXISTS partner_portfolio_files_partner_active_order_idx
  ON public.partner_portfolio_files (partner_id, is_active, display_order);

CREATE TABLE IF NOT EXISTS public.portfolio_requests (
  portfolio_request_id BIGSERIAL PRIMARY KEY,
  partner_id INTEGER NOT NULL REFERENCES public.partners (partner_id) ON DELETE CASCADE,
  visitor_email TEXT NOT NULL,
  status VARCHAR(32) NOT NULL DEFAULT 'sent',
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT portfolio_requests_status_check CHECK (
    status IN ('sent', 'failed', 'rate_limited')
  )
);

CREATE INDEX IF NOT EXISTS portfolio_requests_email_created_idx
  ON public.portfolio_requests (visitor_email, created_at DESC);

CREATE INDEX IF NOT EXISTS portfolio_requests_partner_created_idx
  ON public.portfolio_requests (partner_id, created_at DESC);

CREATE OR REPLACE FUNCTION public.set_partner_portfolio_files_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS partner_portfolio_files_set_updated_at ON public.partner_portfolio_files;

CREATE TRIGGER partner_portfolio_files_set_updated_at
  BEFORE UPDATE ON public.partner_portfolio_files
  FOR EACH ROW
  EXECUTE FUNCTION public.set_partner_portfolio_files_updated_at();

ALTER TABLE public.partner_portfolio_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.portfolio_requests ENABLE ROW LEVEL SECURITY;

-- No public access; edge function uses service role
REVOKE ALL ON public.partner_portfolio_files FROM anon, authenticated;
REVOKE ALL ON public.portfolio_requests FROM anon, authenticated;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.partner_portfolio_files TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.portfolio_requests TO service_role;
GRANT USAGE, SELECT ON SEQUENCE public.partner_portfolio_files_portfolio_file_id_seq TO service_role;
GRANT USAGE, SELECT ON SEQUENCE public.portfolio_requests_portfolio_request_id_seq TO service_role;

-- Private storage bucket for partner PDF brochures
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'partner-portfolios',
  'partner-portfolios',
  FALSE,
  52428800,
  ARRAY['application/pdf']::TEXT[]
)
ON CONFLICT (id) DO UPDATE
SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Seed PDF mappings (storage paths match scripts/upload_partner_portfolios.py)
INSERT INTO public.partner_portfolio_files (partner_id, storage_path, display_name, display_order, is_active)
VALUES
  (12, 'UK/eincobio/EincoBio Solution.pdf', 'EincoBio Solution', 1, TRUE),
  (20, 'UK/astrolabe/Astrolabe Prochure Full Set.pdf', 'Astrolabe Brochure', 1, TRUE),
  (20, 'UK/astrolabe/Astrolabe Surgical-Technique.pdf', 'Astrolabe Surgical Technique', 2, TRUE),
  (10, 'UK/permedica/Permedica.pdf', 'Permedica Overview', 1, TRUE),
  (10, 'UK/permedica/Permedica Products.pdf', 'Permedica Products', 2, TRUE),
  (10, 'UK/permedica/Permedica Solution.pdf', 'Permedica Solutions', 3, TRUE),
  (23, 'UK/orthosintex/Orthosintex Episcan Foot and Ankle 2025.pdf', 'Orthosintex Episcan Foot and Ankle 2025', 1, TRUE)
ON CONFLICT (partner_id, storage_path) DO UPDATE
SET
  display_name = EXCLUDED.display_name,
  display_order = EXCLUDED.display_order,
  is_active = EXCLUDED.is_active;
