ALTER TABLE public.sessions
  ADD COLUMN IF NOT EXISTS venue text DEFAULT '',
  ADD COLUMN IF NOT EXISTS pa_system text DEFAULT '',
  ADD COLUMN IF NOT EXISTS foh_console text DEFAULT '',
  ADD COLUMN IF NOT EXISTS monitor_console text DEFAULT '',
  ADD COLUMN IF NOT EXISTS show_date text DEFAULT '',
  ADD COLUMN IF NOT EXISTS monitor_notes text DEFAULT '',
  ADD COLUMN IF NOT EXISTS monitor_mixes jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS setlist jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS show_log jsonb NOT NULL DEFAULT '[]'::jsonb;