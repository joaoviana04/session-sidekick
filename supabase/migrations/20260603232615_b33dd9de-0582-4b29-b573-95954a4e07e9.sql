ALTER TYPE public.session_type ADD VALUE IF NOT EXISTS 'compose';

ALTER TABLE public.sessions
  ADD COLUMN IF NOT EXISTS lyrics text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS structure jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS ideas jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS instrumentation jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS mood text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS tempo_feel text NOT NULL DEFAULT '';