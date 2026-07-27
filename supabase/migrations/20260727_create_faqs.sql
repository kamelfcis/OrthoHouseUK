-- FAQs (per branch) — public Q&A with category sections
-- Categories (DB slugs): 'general' | 'clinical_supply'
-- Display titles in app: 'General' | 'Clinical & Supply'

CREATE TABLE IF NOT EXISTS public.faqs (
  faq_id SERIAL PRIMARY KEY,
  branch_id INTEGER NOT NULL REFERENCES public.branches (branch_id) ON DELETE CASCADE,
  category VARCHAR(32) NOT NULL,
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  display_order INTEGER NOT NULL DEFAULT 0,
  is_published BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT faqs_category_check CHECK (
    category IN ('general', 'clinical_supply')
  )
);

CREATE INDEX IF NOT EXISTS faqs_branch_category_order_idx
  ON public.faqs (branch_id, category, display_order);

CREATE OR REPLACE FUNCTION public.set_faqs_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS faqs_set_updated_at ON public.faqs;

CREATE TRIGGER faqs_set_updated_at
  BEFORE UPDATE ON public.faqs
  FOR EACH ROW
  EXECUTE FUNCTION public.set_faqs_updated_at();

ALTER TABLE public.faqs ENABLE ROW LEVEL SECURITY;

GRANT SELECT ON public.faqs TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.faqs TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE public.faqs_faq_id_seq TO authenticated;

DROP POLICY IF EXISTS faqs_public_read ON public.faqs;
DROP POLICY IF EXISTS faqs_admin_read ON public.faqs;
DROP POLICY IF EXISTS faqs_branch_manager_read ON public.faqs;
DROP POLICY IF EXISTS faqs_admin_write ON public.faqs;
DROP POLICY IF EXISTS faqs_branch_manager_write ON public.faqs;

-- Public site: published FAQs only
CREATE POLICY faqs_public_read
  ON public.faqs
  FOR SELECT
  TO anon, authenticated
  USING (is_published = TRUE);

-- Admins: read all (including unpublished)
CREATE POLICY faqs_admin_read
  ON public.faqs
  FOR SELECT
  TO authenticated
  USING (public.is_admin(auth.uid()));

-- Branch managers: read all for their branch
CREATE POLICY faqs_branch_manager_read
  ON public.faqs
  FOR SELECT
  TO authenticated
  USING (public.is_branch_manager(auth.uid(), branch_id));

-- Admins: full write access
CREATE POLICY faqs_admin_write
  ON public.faqs
  FOR ALL
  TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

-- Branch managers: write their branch only
CREATE POLICY faqs_branch_manager_write
  ON public.faqs
  FOR ALL
  TO authenticated
  USING (public.is_branch_manager(auth.uid(), branch_id))
  WITH CHECK (public.is_branch_manager(auth.uid(), branch_id));

-- ---------------------------------------------------------------------------
-- Seed UK branch (branch_id = 2) — skip if already seeded
-- ---------------------------------------------------------------------------
INSERT INTO public.faqs (branch_id, category, question, answer, display_order, is_published)
SELECT 2, v.category, v.question, v.answer, v.display_order, TRUE
FROM (
  VALUES
    (
      'general'::varchar,
      'What is ORTHOHOUSE UK?',
      'ORTHOHOUSE UK is an MHRA-registered medical device distributor connecting world-class orthopaedic manufacturers with surgeons, NHS trusts, and private hospitals across the United Kingdom. We specialise in trauma, arthroplasty, foot & ankle, and bone graft solutions.',
      1
    ),
    (
      'general',
      'Who does ORTHOHOUSE UK supply?',
      'We supply orthopaedic implant systems to NHS trusts, private hospitals, and independent surgical centres across the United Kingdom. Our customers include trauma teams, arthroplasty units, and foot & ankle specialists.',
      2
    ),
    (
      'general',
      'How can manufacturers partner with ORTHOHOUSE UK?',
      'We welcome enquiries from orthopaedic manufacturers seeking UK distribution. Contact our partnerships team to discuss regulatory onboarding, UKRP services, and market access strategy.',
      3
    ),
    (
      'general',
      'Where is ORTHOHOUSE UK based, and how do I get in touch?',
      'Our London office is at 2 Kingdom Street, W2 6BD. Call +44 20 3368 3036 or email info@ortho-house.com. You can also use the contact form on our website — we aim to respond within one working day.',
      4
    ),
    (
      'clinical_supply',
      'Are your products MHRA compliant?',
      'Yes. ORTHOHOUSE UK is registered with the MHRA as a medical device distributor and operates as a UK Responsible Person (UKRP). Every product in our portfolio is distributed under full UK regulatory compliance.',
      1
    ),
    (
      'clinical_supply',
      'Do you supply NHS frameworks?',
      'We are an approved supplier on the NHS Scotland Orthopaedic Trauma & Extremity framework. For NHS England, Wales, and Northern Ireland, we work directly with trust procurement teams and can support framework applications where required.',
      2
    ),
    (
      'clinical_supply',
      'What clinical support do you provide?',
      'Each business unit is backed by product specialists who offer case support, product training, and access to our surgical education programme. We exhibit at BOA, BOFAS, and BESS events annually.',
      3
    ),
    (
      'clinical_supply',
      'How do I request product information or a quotation?',
      'Use our contact form or call our London office. A member of the relevant business unit will respond within one working day with product literature, pricing guidance, or a follow-up call.',
      4
    ),
    (
      'clinical_supply',
      'Which orthopaedic specialties do you cover?',
      'Our portfolio spans trauma fixation, arthroplasty, foot & ankle, and bone graft / biologics. Product specialists can advise on system selection, instrumentation, and case planning for your clinical pathway.',
      5
    )
) AS v(category, question, answer, display_order)
WHERE NOT EXISTS (
  SELECT 1 FROM public.faqs WHERE branch_id = 2 LIMIT 1
);
