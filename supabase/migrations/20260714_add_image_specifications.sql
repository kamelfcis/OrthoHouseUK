ALTER TABLE public.product_images
  ADD COLUMN IF NOT EXISTS image_specifications TEXT;
