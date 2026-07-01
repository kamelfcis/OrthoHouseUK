-- Admin policies for partner portfolio tables (created in 20250701120000)

GRANT SELECT, INSERT, UPDATE, DELETE ON public.partner_portfolio_files TO authenticated;
GRANT SELECT, INSERT ON public.portfolio_requests TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE public.partner_portfolio_files_portfolio_file_id_seq TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE public.portfolio_requests_portfolio_request_id_seq TO authenticated;

DROP POLICY IF EXISTS partner_portfolio_files_admin_all ON public.partner_portfolio_files;
DROP POLICY IF EXISTS portfolio_requests_admin_read ON public.portfolio_requests;

CREATE POLICY partner_portfolio_files_admin_all
  ON public.partner_portfolio_files
  FOR ALL
  TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY portfolio_requests_admin_read
  ON public.portfolio_requests
  FOR SELECT
  TO authenticated
  USING (public.is_admin(auth.uid()));
