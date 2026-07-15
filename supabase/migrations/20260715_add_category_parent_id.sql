-- Hierarchical product categories: optional parent_id (one level deep)
ALTER TABLE public.product_categories
  ADD COLUMN IF NOT EXISTS parent_id INTEGER
  REFERENCES public.product_categories(category_id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS product_categories_parent_id_idx
  ON public.product_categories(parent_id);

-- Prevent cycles: parent cannot be self
ALTER TABLE public.product_categories
  DROP CONSTRAINT IF EXISTS product_categories_parent_not_self;

ALTER TABLE public.product_categories
  ADD CONSTRAINT product_categories_parent_not_self
  CHECK (parent_id IS NULL OR parent_id <> category_id);

-- Note: Mirai subcategories (mirai_anatomic, mirai_reverse, mirai_humeral_core)
-- are seeded by scripts/import_mirai_catalog.py after this migration is applied.
