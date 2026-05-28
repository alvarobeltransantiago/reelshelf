-- Habilitamos pgcrypto para generar UUIDs y reutilizar crypt() en seeds
-- sin depender de tooling adicional fuera de PostgreSQL.
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Centralizamos la actualización de updated_at para no confiar en que cada
-- cliente recuerde mantener la marca temporal en todas las escrituras.
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username VARCHAR(50) NOT NULL UNIQUE,
  email VARCHAR(255) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  bio VARCHAR(280),
  avatar_url VARCHAR(500),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT users_username_format_chk CHECK (username ~ '^[A-Za-z0-9_]{3,50}$'),
  CONSTRAINT users_email_lowercase_chk CHECK (email = LOWER(email)),
  CONSTRAINT users_bio_length_chk CHECK (bio IS NULL OR char_length(bio) <= 280),
  CONSTRAINT users_avatar_url_length_chk CHECK (avatar_url IS NULL OR char_length(avatar_url) <= 500)
);

-- DECISION: reforzamos la unicidad del email en minúsculas con un índice
-- funcional para evitar duplicados por casing sin introducir más extensiones.
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_email_lower_unique
  ON users (LOWER(email));

DROP TRIGGER IF EXISTS trg_users_set_updated_at ON users;

CREATE TRIGGER trg_users_set_updated_at
BEFORE UPDATE ON users
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();
