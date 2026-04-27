import { useEffect, useState, useCallback } from "react";
import type { Session, SessionType, InputChannel, Take, ChecklistItem, ReferenceTrack, Revision } from "@/lib/types";

const KEY = "console.sessions.v1";

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

const newSession = (type: SessionType, title: string, artist: string): Session => {
  const base: Session = {
    id: uid(),
    type,
    title,
    artist,
    createdAt: new Date().toISOString(),
    notes: "",
    sampleRate: "48 kHz / 24-bit",
  };
  if (type === "recording") {
    base.inputs = Array.from({ length: 8 }, (_, i) => ({
      id: uid(),
      ch: i + 1,
      source: "",
      mic: "",
      preamp: "",
      phantom: false,
      pad: false,
      hpf: false,
      notes: "",
    }));
    base.takes = [];
  } else {
    base.checklist = defaultMixChecklist();
    base.references = [];
    base.revisions = [];
    base.lufsTarget = "-14 LUFS";
    base.truePeakTarget = "-1 dBTP";
  }
  return base;
};

function load(): Session[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    return JSON.parse(raw) as Session[];
  } catch {
    return [];
  }
}

function save(sessions: Session[]) {
  localStorage.setItem(KEY, JSON.stringify(sessions));
  window.dispatchEvent(new CustomEvent("console:sessions-updated"));
}

export function useSessions() {
  const [sessions, setSessions] = useState<Session[]>(() => load());

  useEffect(() => {
    const handler = () => setSessions(load());
    window.addEventListener("console:sessions-updated", handler);
    window.addEventListener("storage", handler);
    return () => {
      window.removeEventListener("console:sessions-updated", handler);
      window.removeEventListener("storage", handler);
    };
  }, []);

  const create = useCallback((type: SessionType, title: string, artist: string) => {
    const s = newSession(type, title || "Untitled session", artist || "—");
    const next = [s, ...load()];
    save(next);
    return s;
  }, []);

  const update = useCallback((id: string, patch: Partial<Session> | ((s: Session) => Session)) => {
    const next = load().map((s) => {
      if (s.id !== id) return s;
      return typeof patch === "function" ? patch(s) : { ...s, ...patch };
    });
    save(next);
  }, []);

  const remove = useCallback((id: string) => {
    save(load().filter((s) => s.id !== id));
  }, []);

  return { sessions, create, update, remove };
}

export function useSession(id: string | undefined) {
  const { sessions, update, remove } = useSessions();
  const session = sessions.find((s) => s.id === id);
  return { session, update, remove };
}

// Helpers exported for components
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