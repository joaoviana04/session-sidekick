import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import type { CalendarEvent } from "@/lib/types";

function fromRow(r: any): CalendarEvent {
  return {
    id: r.id,
    title: r.title ?? "",
    startsAt: r.starts_at,
    endsAt: r.ends_at ?? null,
    allDay: !!r.all_day,
    location: r.location ?? "",
    notes: r.notes ?? "",
    color: r.color ?? "primary",
    sessionId: r.session_id ?? null,
    createdAt: r.created_at,
  };
}

function toRowPatch(patch: Partial<CalendarEvent>): Record<string, any> {
  const r: Record<string, any> = {};
  if ("title" in patch) r.title = patch.title;
  if ("startsAt" in patch) r.starts_at = patch.startsAt;
  if ("endsAt" in patch) r.ends_at = patch.endsAt;
  if ("allDay" in patch) r.all_day = patch.allDay;
  if ("location" in patch) r.location = patch.location;
  if ("notes" in patch) r.notes = patch.notes;
  if ("color" in patch) r.color = patch.color;
  if ("sessionId" in patch) r.session_id = patch.sessionId;
  return r;
}

export function useCalendarEvents() {
  const { user } = useAuth();
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);

  const refetch = useCallback(async () => {
    if (!user) {
      setEvents([]);
      setLoading(false);
      return;
    }
    const { data, error } = await supabase
      .from("calendar_events")
      .select("*")
      .order("starts_at", { ascending: true });
    if (error) console.error(error);
    setEvents((data ?? []).map(fromRow));
    setLoading(false);
  }, [user]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  const create = useCallback(
    async (patch: Partial<CalendarEvent>) => {
      if (!user) throw new Error("Not authenticated");
      if (!patch.startsAt) throw new Error("startsAt required");
      const row = {
        user_id: user.id,
        title: patch.title ?? "",
        starts_at: patch.startsAt,
        ends_at: patch.endsAt ?? null,
        all_day: patch.allDay ?? false,
        location: patch.location ?? "",
        notes: patch.notes ?? "",
        color: patch.color ?? "primary",
        session_id: patch.sessionId ?? null,
      };
      const { data, error } = await supabase
        .from("calendar_events")
        .insert(row)
        .select()
        .single();
      if (error) throw error;
      const created = fromRow(data);
      setEvents((arr) => [...arr, created].sort((a, b) => a.startsAt.localeCompare(b.startsAt)));
      return created;
    },
    [user],
  );

  const update = useCallback(async (id: string, patch: Partial<CalendarEvent>) => {
    setEvents((arr) => arr.map((e) => (e.id === id ? { ...e, ...patch } : e)));
    const { error } = await supabase
      .from("calendar_events")
      .update(toRowPatch(patch) as any)
      .eq("id", id);
    if (error) console.error(error);
  }, []);

  const remove = useCallback(async (id: string) => {
    setEvents((arr) => arr.filter((e) => e.id !== id));
    const { error } = await supabase.from("calendar_events").delete().eq("id", id);
    if (error) console.error(error);
  }, []);

  return { events, loading, create, update, remove, refetch };
}