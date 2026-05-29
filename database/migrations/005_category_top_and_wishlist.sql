DROP INDEX IF EXISTS idx_reviews_user_top_rank_unique;

CREATE UNIQUE INDEX IF NOT EXISTS idx_reviews_user_category_top_rank_unique
  ON reviews (user_id, category, top_rank)
  WHERE top_rank IS NOT NULL;

CREATE TABLE IF NOT EXISTS wishlist_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(200) NOT NULL,
  author VARCHAR(160),
  category VARCHAR(10) NOT NULL,
  notes TEXT,
  cover_url TEXT,
  rank SMALLINT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT wishlist_items_title_length_chk CHECK (char_length(title) BETWEEN 1 AND 200),
  CONSTRAINT wishlist_items_author_length_chk CHECK (author IS NULL OR char_length(author) BETWEEN 1 AND 160),
  CONSTRAINT wishlist_items_category_chk CHECK (category IN ('game', 'movie', 'series', 'book')),
  CONSTRAINT wishlist_items_notes_length_chk CHECK (notes IS NULL OR char_length(notes) <= 1000),
  CONSTRAINT wishlist_items_cover_url_length_chk CHECK (cover_url IS NULL OR char_length(cover_url) <= 2000000),
  CONSTRAINT wishlist_items_rank_chk CHECK (rank BETWEEN 1 AND 32767)
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_wishlist_items_user_category_rank_unique
  ON wishlist_items (user_id, category, rank);

CREATE INDEX IF NOT EXISTS idx_wishlist_items_user_category_created
  ON wishlist_items (user_id, category, created_at DESC);

DROP TRIGGER IF EXISTS trg_wishlist_items_set_updated_at ON wishlist_items;

CREATE TRIGGER trg_wishlist_items_set_updated_at
BEFORE UPDATE ON wishlist_items
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();
