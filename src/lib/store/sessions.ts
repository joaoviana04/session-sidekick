import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Session, SessionType, InputChannel, Take, ChecklistItem, ReferenceTrack, Revision } from "@/lib/types";
import { useAuth } from "@/hooks/useAuth";

const uid = () => Math.random().toString(36).slice(2, 10);

const defaultMixChecklist = (): ChecklistItem[] => {
  const groups: Record<string, string[]> = {
    "Pre-flight": [
      "Sample rate / bit depth confirmed",
      "Session backed up",
      "Color-coded & labeled tracks",
      "Reference tracks imported & gain-matched",
    ],
    "Balance": [
      "Static mix done (faders only)",
      "Phase / polarity check on multi-mic sources",
      "Mono compatibility check",
      "Low-end check on subs / headphones / car",
    ],
    "Bus & Master": [
      "Mix bus chain dialed",
      "True peak below target",
      "LUFS hits target",
      "Headroom for mastering (-6 dBFS)",
    ],
    "Delivery": [
      "Print stems",
      "Print instrumental + TV mix",
      "Export 24-bit WAV @ session SR",
      "Notes & revision archived",
    ],
  };
  return Object.entries(groups).flatMap(([group, items]) =>
    items.map((label) => ({ id: uid(), label, done: false, group }))
  );
};

// Maps DB row (snake_case) to app Session shape
function fromRow(row: any): Session {
  return {
    id: row.id,
    type: row.type,
    title: row.title,
    artist: row.artist ?? "",
    notes: row.notes ?? "",
    bpm: row.bpm ?? "",
    key: row.key ?? "",
    sampleRate: row.sample_rate ?? "",
    lufsTarget: row.lufs_target ?? "",
    truePeakTarget: row.true_peak_target ?? "",
    inputs: row.inputs ?? [],
    takes: row.takes ?? [],
    checklist: row.checklist ?? [],
    references: row.references ?? [],
    revisions: row.revisions ?? [],
    createdAt: row.created_at,
    projectId: row.project_id ?? null,
  };
}

function toRowPatch(patch: Partial<Session>): Record<string, any> {
  const p: Record<string, any> = {};
  if ("title" in patch) p.title = patch.title;
  if ("artist" in patch) p.artist = patch.artist;
  if ("notes" in patch) p.notes = patch.notes;
  if ("bpm" in patch) p.bpm = patch.bpm;
  if ("key" in patch) p.key = patch.key;
  if ("sampleRate" in patch) p.sample_rate = patch.sampleRate;
  if ("lufsTarget" in patch) p.lufs_target = patch.lufsTarget;
  if ("truePeakTarget" in patch) p.true_peak_target = patch.truePeakTarget;
  if ("inputs" in patch) p.inputs = patch.inputs;
  if ("takes" in patch) p.takes = patch.takes;
  if ("checklist" in patch) p.checklist = patch.checklist;
  if ("references" in patch) p.references = patch.references;
  if ("revisions" in patch) p.revisions = patch.revisions;
  if ("projectId" in patch) p.project_id = patch.projectId;
  return p;
}

export function useSessions(projectId?: string | null) {
  const { user } = useAuth();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);

  const refetch = useCallback(async () => {
    if (!user) { setSessions([]); setLoading(false); return; }
    let q = supabase.from("sessions").select("*").order("created_at", { ascending: false });
    if (projectId !== undefined) {
      if (projectId === null) q = q.is("project_id", null);
      else q = q.eq("project_id", projectId);
    }
    const { data, error } = await q;
    if (error) { console.error(error); setSessions([]); }
    else setSessions((data ?? []).map(fromRow));
    setLoading(false);
  }, [user, projectId]);

  useEffect(() => { refetch(); }, [refetch]);

  // Realtime
  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel("sessions-changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "sessions", filter: `user_id=eq.${user.id}` }, () => {
        refetch();
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user, refetch]);

  const create = useCallback(async (type: SessionType, title: string, artist: string, projectId?: string | null) => {
    if (!user) throw new Error("Not authenticated");
    const base: any = {
      user_id: user.id,
      type,
      title: title || "Untitled session",
      artist: artist || "",
      project_id: projectId ?? null,
      sample_rate: "48 kHz / 24-bit",
    };
    if (type === "recording") {
      base.inputs = Array.from({ length: 8 }, (_, i) => ({
        id: uid(), ch: i + 1, source: "", mic: "", preamp: "",
        phantom: false, pad: false, hpf: false, notes: "",
      }));
      base.takes = [];
    } else {
      base.checklist = defaultMixChecklist();
      base.lufs_target = "-14 LUFS";
      base.true_peak_target = "-1 dBTP";
    }
    const { data, error } = await supabase.from("sessions").insert(base).select().single();
    if (error) throw error;
    await refetch();
    return fromRow(data);
  }, [user, refetch]);

  const update = useCallback(async (id: string, patch: Partial<Session> | ((s: Session) => Session)) => {
    if (!user) return;
    let row: Partial<Session>;
    if (typeof patch === "function") {
      const current = sessions.find((s) => s.id === id);
      if (!current) return;
      const next = patch(current);
      row = next;
      // optimistic
      setSessions((arr) => arr.map((s) => s.id === id ? next : s));
    } else {
      row = patch;
      setSessions((arr) => arr.map((s) => s.id === id ? { ...s, ...patch } : s));
    }
    const { error } = await supabase.from("sessions").update(toRowPatch(row)).eq("id", id);
    if (error) { console.error(error); refetch(); }
  }, [user, sessions, refetch]);

  const remove = useCallback(async (id: string) => {
    setSessions((arr) => arr.filter((s) => s.id !== id));
    const { error } = await supabase.from("sessions").delete().eq("id", id);
    if (error) { console.error(error); refetch(); }
  }, [refetch]);

  return { sessions, loading, create, update, remove, refetch };
}

export function useSession(id: string | undefined) {
  const { sessions, update, remove } = useSessions();
  const session = sessions.find((s) => s.id === id);
  return { session, update, remove };
}

export const helpers = {
  uid,
  newInput: (ch: number): InputChannel => ({
    id: uid(), ch, source: "", mic: "", preamp: "", phantom: false, pad: false, hpf: false, notes: "",
  }),
  newTake: (song: string, number: string): Take => ({
    id: uid(), song, number, timestamp: new Date().toISOString(), rating: "unrated", notes: "",
  }),
  newReference: (): ReferenceTrack => ({
    id: uid(), title: "", artist: "", lufs: "", notes: "",
  }),
  newRevision: (version: string): Revision => ({
    id: uid(), version, date: new Date().toISOString(), status: "draft", feedback: "", changes: "",
  }),
};
