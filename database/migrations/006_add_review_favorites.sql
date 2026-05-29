ALTER TABLE reviews
ADD COLUMN IF NOT EXISTS is_favorite BOOLEAN NOT NULL DEFAULT FALSE;

CREATE INDEX IF NOT EXISTS idx_reviews_user_category_favorite
ON reviews (user_id, category, is_favorite)
WHERE is_favorite = TRUE;
