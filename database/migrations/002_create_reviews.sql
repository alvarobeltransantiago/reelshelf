-- Validamos arrays de tags con funciones inmutables para que la regla viva
-- junto al esquema y no dependa solo de la capa de aplicación.
CREATE OR REPLACE FUNCTION review_tags_have_valid_length(tags_input VARCHAR(30)[])
RETURNS BOOLEAN AS $$
DECLARE
  current_tag VARCHAR(30);
BEGIN
  IF tags_input IS NULL THEN
    RETURN TRUE;
  END IF;

  FOREACH current_tag IN ARRAY tags_input
  LOOP
    IF char_length(current_tag) < 1 OR char_length(current_tag) > 30 THEN
      RETURN FALSE;
    END IF;
  END LOOP;

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

CREATE OR REPLACE FUNCTION review_tags_have_valid_format(tags_input VARCHAR(30)[])
RETURNS BOOLEAN AS $$
DECLARE
  current_tag VARCHAR(30);
BEGIN
  IF tags_input IS NULL THEN
    RETURN TRUE;
  END IF;

  FOREACH current_tag IN ARRAY tags_input
  LOOP
    IF current_tag <> lower(current_tag) OR current_tag ~ '\s' OR current_tag !~ '^[a-z0-9-]+$' THEN
      RETURN FALSE;
    END IF;
  END LOOP;

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

CREATE TABLE IF NOT EXISTS reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(200) NOT NULL,
  category VARCHAR(10) NOT NULL,
  cover_url VARCHAR(500),
  rating SMALLINT NOT NULL,
  body TEXT NOT NULL,
  tags VARCHAR(30)[],
  status VARCHAR(10) NOT NULL DEFAULT 'draft',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT reviews_title_length_chk CHECK (char_length(title) BETWEEN 1 AND 200),
  CONSTRAINT reviews_category_chk CHECK (category IN ('game', 'movie', 'series')),
  CONSTRAINT reviews_cover_url_length_chk CHECK (cover_url IS NULL OR char_length(cover_url) <= 500),
  CONSTRAINT reviews_rating_chk CHECK (rating BETWEEN 1 AND 10),
  CONSTRAINT reviews_body_length_chk CHECK (char_length(body) BETWEEN 50 AND 5000),
  CONSTRAINT reviews_status_chk CHECK (status IN ('published', 'draft')),
  CONSTRAINT reviews_tags_count_chk CHECK (tags IS NULL OR cardinality(tags) <= 5),
  CONSTRAINT reviews_tags_item_length_chk CHECK (review_tags_have_valid_length(tags)),
  CONSTRAINT reviews_tags_item_format_chk CHECK (review_tags_have_valid_format(tags))
);

CREATE INDEX IF NOT EXISTS idx_reviews_user_id
  ON reviews (user_id);

CREATE INDEX IF NOT EXISTS idx_reviews_category
  ON reviews (category);

CREATE INDEX IF NOT EXISTS idx_reviews_status
  ON reviews (status);

CREATE INDEX IF NOT EXISTS idx_reviews_created
  ON reviews (created_at DESC);

-- Mantenemos el índice recomendado para acelerar búsquedas textuales simples
-- por título sin cambiar la API pública a búsquedas complejas.
CREATE INDEX IF NOT EXISTS idx_reviews_title_gin
  ON reviews USING gin (to_tsvector('spanish', title));

DROP TRIGGER IF EXISTS trg_reviews_set_updated_at ON reviews;

CREATE TRIGGER trg_reviews_set_updated_at
BEFORE UPDATE ON reviews
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();
