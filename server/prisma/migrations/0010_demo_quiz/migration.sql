-- Migration 0010: demo_rooms + tajweed_quiz_results

CREATE TABLE demo_rooms (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  title       TEXT        NOT NULL,
  description TEXT,
  room_slug   TEXT        NOT NULL UNIQUE,
  is_active   BOOLEAN     NOT NULL DEFAULT false,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE tajweed_quiz_results (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  name       TEXT,
  email      TEXT,
  score      INTEGER     NOT NULL,
  max_score  INTEGER     NOT NULL,
  answers    JSONB       NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX tajweed_quiz_results_created_at_idx ON tajweed_quiz_results(created_at);
