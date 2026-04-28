import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import type { Client } from "@/lib/types";

function fromRow(r: any): Client {
  return { id: r.id, name: r.name, notes: r.notes ?? "", createdAt: r.created_at };
}

export function useClients() {
  const { user } = useAuth();
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);

  const refetch = useCallback(async () => {
    if (!user) { setClients([]); setLoading(false); return; }
    const { data, error } = await supabase.from("clients").select("*").order("name");
    if (error) console.error(error);
    setClients((data ?? []).map(fromRow));
    setLoading(false);
  }, [user]);

  useEffect(() => { refetch(); }, [refetch]);

  const create = useCallback(async (name: string, notes = "") => {
    if (!user) throw new Error("Not authenticated");
    const { data, error } = await supabase.from("clients")
      .insert({ user_id: user.id, name, notes }).select().single();
    if (error) throw error;
    await refetch();
    return fromRow(data);
  }, [user, refetch]);

  const update = useCallback(async (id: string, patch: Partial<Pick<Client, "name" | "notes">>) => {
    setClients((arr) => arr.map((c) => c.id === id ? { ...c, ...patch } : c));
    await supabase.from("clients").update(patch).eq("id", id);
  }, []);

  const remove = useCallback(async (id: string) => {
    setClients((arr) => arr.filter((c) => c.id !== id));
    await supabase.from("clients").delete().eq("id", id);
  }, []);

  return { clients, loading, create, update, remove, refetch };
}
