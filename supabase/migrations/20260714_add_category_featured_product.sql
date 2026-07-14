ALTER TABLE public.branch_products
  ADD COLUMN IF NOT EXISTS is_category_featured BOOLEAN NOT NULL DEFAULT FALSE;
