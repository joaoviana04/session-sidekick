import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import type { Project } from "@/lib/types";

function fromRow(r: any): Project {
  return {
    id: r.id, name: r.name, notes: r.notes ?? "",
    color: r.color ?? "amber", clientId: r.client_id ?? null,
    createdAt: r.created_at,
  };
}

export function useProjects(clientId?: string | null) {
  const { user } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  const refetch = useCallback(async () => {
    if (!user) { setProjects([]); setLoading(false); return; }
    let q = supabase.from("projects").select("*").order("created_at", { ascending: false });
    if (clientId !== undefined) {
      if (clientId === null) q = q.is("client_id", null);
      else q = q.eq("client_id", clientId);
    }
    const { data, error } = await q;
    if (error) console.error(error);
    setProjects((data ?? []).map(fromRow));
    setLoading(false);
  }, [user, clientId]);

  useEffect(() => { refetch(); }, [refetch]);

  const create = useCallback(async (name: string, clientId: string | null = null, color = "amber") => {
    if (!user) throw new Error("Not authenticated");
    const { data, error } = await supabase.from("projects")
      .insert({ user_id: user.id, name, client_id: clientId, color }).select().single();
    if (error) throw error;
    await refetch();
    return fromRow(data);
  }, [user, refetch]);

  const update = useCallback(async (id: string, patch: Partial<Pick<Project, "name" | "notes" | "color" | "clientId">>) => {
    setProjects((arr) => arr.map((p) => p.id === id ? { ...p, ...patch } : p));
    const row: any = { ...patch };
    if ("clientId" in patch) { row.client_id = patch.clientId; delete row.clientId; }
    await supabase.from("projects").update(row).eq("id", id);
  }, []);

  const remove = useCallback(async (id: string) => {
    setProjects((arr) => arr.filter((p) => p.id !== id));
    await supabase.from("projects").delete().eq("id", id);
  }, []);

  return { projects, loading, create, update, remove, refetch };
}
