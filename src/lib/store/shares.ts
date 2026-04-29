import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export interface SessionShare {
  id: string;
  session_id: string;
  token: string;
  active: boolean;
  created_at: string;
}

export interface RevisionFeedback {
  id: string;
  share_id: string;
  session_id: string;
  revision_id: string;
  client_name: string;
  feedback: string;
  decision: "pending" | "approved" | "revise";
  updated_at: string;
}

export function useSessionShares(sessionId: string | undefined) {
  const { user } = useAuth();
  const [shares, setShares] = useState<SessionShare[]>([]);
  const [feedback, setFeedback] = useState<RevisionFeedback[]>([]);
  const [loading, setLoading] = useState(true);

  const refetch = useCallback(async () => {
    if (!user || !sessionId) {
      setShares([]);
      setFeedback([]);
      setLoading(false);
      return;
    }
    const [sRes, fRes] = await Promise.all([
      supabase
        .from("session_shares")
        .select("*")
        .eq("session_id", sessionId)
        .order("created_at", { ascending: false }),
      supabase
        .from("revision_feedback")
        .select("*")
        .eq("session_id", sessionId)
        .order("updated_at", { ascending: false }),
    ]);
    if (sRes.error) console.error(sRes.error);
    if (fRes.error) console.error(fRes.error);
    setShares((sRes.data ?? []) as SessionShare[]);
    setFeedback((fRes.data ?? []) as RevisionFeedback[]);
    setLoading(false);
  }, [user, sessionId]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  // Realtime feedback updates
  useEffect(() => {
    if (!user || !sessionId) return;
    const channel = supabase
      .channel(`shares-${sessionId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "revision_feedback",
          filter: `session_id=eq.${sessionId}`,
        },
        () => refetch(),
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "session_shares",
          filter: `session_id=eq.${sessionId}`,
        },
        () => refetch(),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, sessionId, refetch]);

  const createShare = useCallback(async () => {
    if (!user || !sessionId) throw new Error("Not authenticated");
    const { data, error } = await supabase
      .from("session_shares")
      .insert({ session_id: sessionId, user_id: user.id })
      .select()
      .single();
    if (error) throw error;
    await refetch();
    return data as SessionShare;
  }, [user, sessionId, refetch]);

  const toggleShare = useCallback(
    async (id: string, active: boolean) => {
      const { error } = await supabase
        .from("session_shares")
        .update({ active })
        .eq("id", id);
      if (error) console.error(error);
      await refetch();
    },
    [refetch],
  );

  const removeShare = useCallback(
    async (id: string) => {
      const { error } = await supabase.from("session_shares").delete().eq("id", id);
      if (error) console.error(error);
      await refetch();
    },
    [refetch],
  );

  return { shares, feedback, loading, createShare, toggleShare, removeShare, refetch };
}