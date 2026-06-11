import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import type { Session, SessionTemplate, SessionType } from "@/lib/types";

function fromRow(r: any): SessionTemplate {
  return {
    id: r.id,
    type: r.type,
    name: r.name,
    data: r.data ?? {},
    createdAt: r.created_at,
  };
}

// Fields worth carrying over when starting a new session from a template.
const TEMPLATE_FIELDS: (keyof Session)[] = [
  "inputs",
  "checklist",
  "monitorMixes",
  "setlist",
  "instrumentation",
  "structure",
  "lufsTarget",
  "truePeakTarget",
  "sampleRate",
  "paSystem",
  "fohConsole",
  "monitorConsole",
];

export function pickTemplateData(session: Session): Partial<Session> {
  const data: Record<string, any> = {};
  for (const key of TEMPLATE_FIELDS) {
    const value = session[key];
    if (value === undefined) continue;
    if (Array.isArray(value)) {
      // Strip ids/state so applying the template creates fresh items.
      data[key] = value.map((item: any) => {
        const { id, done, ...rest } = item ?? {};
        return { ...rest, id: Math.random().toString(36).slice(2, 10), ...(("done" in (item ?? {})) ? { done: false } : {}) };
      });
    } else {
      data[key] = value;
    }
  }
  return data as Partial<Session>;
}

export function useSessionTemplates(type?: SessionType) {
  const { user } = useAuth();
  const [templates, setTemplates] = useState<SessionTemplate[]>([]);
  const [loading, setLoading] = useState(true);

  const refetch = useCallback(async () => {
    if (!user) {
      setTemplates([]);
      setLoading(false);
      return;
    }
    const { data, error } = await supabase
      .from("session_templates")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) console.error(error);
    setTemplates((data ?? []).map(fromRow));
    setLoading(false);
  }, [user]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  const create = useCallback(
    async (sessionType: SessionType, name: string, data: Partial<Session>) => {
      if (!user) throw new Error("Not authenticated");
      const { data: row, error } = await supabase
        .from("session_templates")
        .insert({ user_id: user.id, type: sessionType, name, data: data as any })
        .select()
        .single();
      if (error) throw error;
      const created = fromRow(row);
      setTemplates((arr) => [created, ...arr]);
      return created;
    },
    [user],
  );

  const remove = useCallback(async (id: string) => {
    setTemplates((arr) => arr.filter((t) => t.id !== id));
    const { error } = await supabase.from("session_templates").delete().eq("id", id);
    if (error) console.error(error);
  }, []);

  const filtered = type ? templates.filter((t) => t.type === type) : templates;

  return { templates: filtered, loading, create, remove, refetch };
}
