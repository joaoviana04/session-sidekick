import { useState, useCallback, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export function useSessionShare(sessionId: string) {
  const { user } = useAuth();
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!user) { setLoading(false); return; }
    const { data } = await supabase
      .from("session_shares")
      .select("token")
      .eq("session_id", sessionId)
      .is("revoked_at", null)
      .maybeSingle();
    setToken(data?.token ?? null);
    setLoading(false);
  }, [user, sessionId]);

  useEffect(() => { load(); }, [load]);

  const create = useCallback(async (): Promise<string | null> => {
    if (!user) return null;
    const t = crypto.randomUUID();
    const { error } = await supabase.from("session_shares").insert({
      token: t,
      session_id: sessionId,
      created_by: user.id,
    });
    if (error) { console.error(error); return null; }
    setToken(t);
    return t;
  }, [user, sessionId]);

  const revoke = useCallback(async () => {
    if (!token) return;
    await supabase
      .from("session_shares")
      .update({ revoked_at: new Date().toISOString() })
      .eq("token", token);
    setToken(null);
  }, [token]);

  return { token, loading, create, revoke };
}
