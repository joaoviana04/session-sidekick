-- Public shares table: one row per share link per session
CREATE TABLE public.session_shares (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES public.sessions(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  token text NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(18), 'base64'),
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX session_shares_session_id_idx ON public.session_shares(session_id);
CREATE INDEX session_shares_token_idx ON public.session_shares(token);

ALTER TABLE public.session_shares ENABLE ROW LEVEL SECURITY;

-- Owner manages their shares
CREATE POLICY "Owners select own shares" ON public.session_shares
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Owners insert own shares" ON public.session_shares
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Owners update own shares" ON public.session_shares
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Owners delete own shares" ON public.session_shares
  FOR DELETE USING (auth.uid() = user_id);

CREATE TRIGGER session_shares_set_updated_at
  BEFORE UPDATE ON public.session_shares
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Client feedback per revision
CREATE TABLE public.revision_feedback (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  share_id uuid NOT NULL REFERENCES public.session_shares(id) ON DELETE CASCADE,
  session_id uuid NOT NULL REFERENCES public.sessions(id) ON DELETE CASCADE,
  revision_id text NOT NULL,
  client_name text NOT NULL DEFAULT '',
  feedback text NOT NULL DEFAULT '',
  decision text NOT NULL DEFAULT 'pending' CHECK (decision IN ('pending','approved','revise')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (share_id, revision_id)
);

CREATE INDEX revision_feedback_share_id_idx ON public.revision_feedback(share_id);
CREATE INDEX revision_feedback_session_id_idx ON public.revision_feedback(session_id);

ALTER TABLE public.revision_feedback ENABLE ROW LEVEL SECURITY;

-- Owner can read all feedback for their sessions
CREATE POLICY "Owners read feedback for own sessions" ON public.revision_feedback
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.sessions s WHERE s.id = revision_feedback.session_id AND s.user_id = auth.uid())
  );

-- Owner can delete feedback for own sessions
CREATE POLICY "Owners delete feedback for own sessions" ON public.revision_feedback
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.sessions s WHERE s.id = revision_feedback.session_id AND s.user_id = auth.uid())
  );

-- Anyone (anon + authenticated) can insert/update feedback IF the share is active
-- and the session_id matches the share's session_id.
CREATE POLICY "Public can insert feedback via active share" ON public.revision_feedback
  FOR INSERT TO anon, authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.session_shares ss
      WHERE ss.id = revision_feedback.share_id
        AND ss.active = true
        AND ss.session_id = revision_feedback.session_id
    )
  );

CREATE POLICY "Public can update feedback via active share" ON public.revision_feedback
  FOR UPDATE TO anon, authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.session_shares ss
      WHERE ss.id = revision_feedback.share_id AND ss.active = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.session_shares ss
      WHERE ss.id = revision_feedback.share_id
        AND ss.active = true
        AND ss.session_id = revision_feedback.session_id
    )
  );

CREATE TRIGGER revision_feedback_set_updated_at
  BEFORE UPDATE ON public.revision_feedback
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Edge function will use service role to read share + session by token,
-- so we don't need a public SELECT policy on session_shares or sessions.

-- Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.sessions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.projects;
ALTER PUBLICATION supabase_realtime ADD TABLE public.clients;
ALTER PUBLICATION supabase_realtime ADD TABLE public.session_shares;
ALTER PUBLICATION supabase_realtime ADD TABLE public.revision_feedback;