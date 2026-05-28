ALTER TABLE users
  ALTER COLUMN avatar_url TYPE TEXT;

ALTER TABLE users
  DROP CONSTRAINT IF EXISTS users_avatar_url_length_chk;

ALTER TABLE users
  ADD CONSTRAINT users_avatar_url_length_chk
  CHECK (avatar_url IS NULL OR char_length(avatar_url) <= 2000000);

ALTER TABLE reviews
  DROP CONSTRAINT IF EXISTS reviews_category_chk;

ALTER TABLE reviews
  ADD COLUMN IF NOT EXISTS author VARCHAR(160);

ALTER TABLE reviews
  ADD COLUMN IF NOT EXISTS aspect_ratings JSONB NOT NULL DEFAULT '{}'::jsonb;

ALTER TABLE reviews
  ADD COLUMN IF NOT EXISTS top_rank SMALLINT;

ALTER TABLE reviews
  DROP CONSTRAINT IF EXISTS reviews_author_length_chk;

ALTER TABLE reviews
  ADD CONSTRAINT reviews_author_length_chk
  CHECK (author IS NULL OR char_length(author) BETWEEN 1 AND 160);

ALTER TABLE reviews
  DROP CONSTRAINT IF EXISTS reviews_aspect_ratings_object_chk;

ALTER TABLE reviews
  ADD CONSTRAINT reviews_aspect_ratings_object_chk
  CHECK (jsonb_typeof(aspect_ratings) = 'object');

ALTER TABLE reviews
  DROP CONSTRAINT IF EXISTS reviews_top_rank_chk;

ALTER TABLE reviews
  ADD CONSTRAINT reviews_top_rank_chk
  CHECK (top_rank IS NULL OR top_rank BETWEEN 1 AND 10);

ALTER TABLE reviews
  ADD CONSTRAINT reviews_category_chk
  CHECK (category IN ('game', 'movie', 'series', 'book'));

CREATE UNIQUE INDEX IF NOT EXISTS idx_reviews_user_top_rank_unique
  ON reviews (user_id, top_rank)
  WHERE top_rank IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_reviews_user_category_created
  ON reviews (user_id, category, created_at DESC);

UPDATE reviews
SET author = CASE
  WHEN title ILIKE '%Citizen Sleeper%' THEN 'Jump Over The Age'
  WHEN title ILIKE '%Helldivers%' THEN 'Arrowhead Game Studios'
  WHEN title ILIKE '%Anatom%' THEN 'Justine Triet'
  WHEN title ILIKE '%Misi%' THEN 'Christopher McQuarrie'
  WHEN title ILIKE '%Shogun%' THEN 'Rachel Kondo y Justin Marks'
  WHEN title ILIKE '%Severance%' THEN 'Dan Erickson'
  ELSE 'Autor pendiente'
END
WHERE author IS NULL;

UPDATE reviews
SET aspect_ratings = CASE category
  WHEN 'game' THEN jsonb_build_object(
    'gameplay', LEAST(10, rating),
    'story', LEAST(10, rating),
    'sound', GREATEST(6, rating - 1),
    'art-direction', LEAST(10, rating),
    'performance', GREATEST(6, rating - 1)
  )
  WHEN 'movie' THEN jsonb_build_object(
    'direction', LEAST(10, rating),
    'script', LEAST(10, rating),
    'cinematography', LEAST(10, rating),
    'soundtrack', GREATEST(6, rating - 1),
    'performances', LEAST(10, rating)
  )
  WHEN 'series' THEN jsonb_build_object(
    'writing', LEAST(10, rating),
    'characters', LEAST(10, rating),
    'pacing', GREATEST(6, rating - 1),
    'soundtrack', GREATEST(6, rating - 1),
    'ending', LEAST(10, rating)
  )
  ELSE '{}'::jsonb
END
WHERE aspect_ratings = '{}'::jsonb;
