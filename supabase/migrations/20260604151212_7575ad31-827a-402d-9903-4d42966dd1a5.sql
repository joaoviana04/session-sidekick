
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS hourly_rate numeric(10,2),
  ADD COLUMN IF NOT EXISTS currency text NOT NULL DEFAULT 'EUR',
  ADD COLUMN IF NOT EXISTS bio text,
  ADD COLUMN IF NOT EXISTS timezone text,
  ADD COLUMN IF NOT EXISTS locale text;

ALTER TABLE public.sessions
  ADD COLUMN IF NOT EXISTS hourly_rate numeric(10,2);
