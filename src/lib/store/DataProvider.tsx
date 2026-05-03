import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import type {
  Session,
  SessionType,
  Project,
  Client,
  MonitorMix,
} from "@/lib/types";

const uid = () => Math.random().toString(36).slice(2, 10);

const defaultMonitorMixes = (): MonitorMix[] => [
  { id: uid(), mixNumber: "1", performer: "Lead vocals", type: "iem", contents: "", notes: "" },
  { id: uid(), mixNumber: "2", performer: "Drums", type: "iem", contents: "", notes: "" },
  { id: uid(), mixNumber: "3", performer: "Bass", type: "wedge", contents: "", notes: "" },
  { id: uid(), mixNumber: "4", performer: "Guitar", type: "wedge", contents: "", notes: "" },
];

function sessionFromRow(row: any): Session {
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
    venue: row.venue ?? "",
    paSystem: row.pa_system ?? "",
    fohConsole: row.foh_console ?? "",
    monitorConsole: row.monitor_console ?? "",
    showDate: row.show_date ?? "",
    monitorNotes: row.monitor_notes ?? "",
    monitorMixes: row.monitor_mixes ?? [],
    setlist: row.setlist ?? [],
    showLog: row.show_log ?? [],
  };
}

function sessionToRowPatch(patch: Partial<Session>): Record<string, any> {
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
  if ("venue" in patch) p.venue = patch.venue;
  if ("paSystem" in patch) p.pa_system = patch.paSystem;
  if ("fohConsole" in patch) p.foh_console = patch.fohConsole;
  if ("monitorConsole" in patch) p.monitor_console = patch.monitorConsole;
  if ("showDate" in patch) p.show_date = patch.showDate;
  if ("monitorNotes" in patch) p.monitor_notes = patch.monitorNotes;
  if ("monitorMixes" in patch) p.monitor_mixes = patch.monitorMixes;
  if ("setlist" in patch) p.setlist = patch.setlist;
  if ("showLog" in patch) p.show_log = patch.showLog;
  return p;
}

function projectFromRow(r: any): Project {
  return {
    id: r.id,
    name: r.name,
    notes: r.notes ?? "",
    color: r.color ?? "amber",
    clientId: r.client_id ?? null,
    createdAt: r.created_at,
  };
}

function clientFromRow(r: any): Client {
  return {
    id: r.id,
    name: r.name,
    notes: r.notes ?? "",
    createdAt: r.created_at,
  };
}

interface DataCtx {
  loading: boolean;
  // Sessions
  sessions: Session[];
  createSession: (
    type: SessionType,
    title: string,
    artist: string,
    projectId?: string | null,
  ) => Promise<Session>;
  updateSession: (
    id: string,
    patch: Partial<Session> | ((s: Session) => Session),
  ) => Promise<void>;
  removeSession: (id: string) => Promise<void>;
  // Projects
  projects: Project[];
  createProject: (
    name: string,
    clientId?: string | null,
    color?: string,
  ) => Promise<Project>;
  updateProject: (
    id: string,
    patch: Partial<Pick<Project, "name" | "notes" | "color" | "clientId">>,
  ) => Promise<void>;
  removeProject: (id: string) => Promise<void>;
  // Clients
  clients: Client[];
  createClient: (name: string, notes?: string) => Promise<Client>;
  updateClient: (
    id: string,
    patch: Partial<Pick<Client, "name" | "notes">>,
  ) => Promise<void>;
  removeClient: (id: string) => Promise<void>;
  refetchAll: () => Promise<void>;
}

const Ctx = createContext<DataCtx | null>(null);

export const DataProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const sessionsRef = useRef<Session[]>([]);
  sessionsRef.current = sessions;

  // Debounced session writes — coalesce per-session field changes
  const pendingPatches = useRef<Map<string, Record<string, any>>>(new Map());
  const flushTimers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  const flushSession = useCallback(async (id: string) => {
    const row = pendingPatches.current.get(id);
    if (!row || Object.keys(row).length === 0) return;
    pendingPatches.current.delete(id);
    const t = flushTimers.current.get(id);
    if (t) {
      clearTimeout(t);
      flushTimers.current.delete(id);
    }
    const { error } = await supabase
      .from("sessions")
      .update(row as any)
      .eq("id", id);
    if (error) {
      console.error(error);
      refetchAll();
    }
  }, []);

  // Flush all pending writes when the page is hidden / unloaded
  useEffect(() => {
    const flushAll = () => {
      for (const id of Array.from(pendingPatches.current.keys())) {
        flushSession(id);
      }
    };
    window.addEventListener("beforeunload", flushAll);
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "hidden") flushAll();
    });
    return () => {
      window.removeEventListener("beforeunload", flushAll);
    };
  }, [flushSession]);

  const refetchAll = useCallback(async () => {
    if (!user) {
      setSessions([]);
      setProjects([]);
      setClients([]);
      setLoading(false);
      return;
    }
    const [sRes, pRes, cRes] = await Promise.all([
      supabase.from("sessions").select("*").order("created_at", { ascending: false }),
      supabase.from("projects").select("*").order("created_at", { ascending: false }),
      supabase.from("clients").select("*").order("name"),
    ]);
    if (sRes.error) console.error(sRes.error);
    if (pRes.error) console.error(pRes.error);
    if (cRes.error) console.error(cRes.error);
    setSessions((sRes.data ?? []).map(sessionFromRow));
    setProjects((pRes.data ?? []).map(projectFromRow));
    setClients((cRes.data ?? []).map(clientFromRow));
    setLoading(false);
  }, [user]);

  useEffect(() => {
    refetchAll();
  }, [refetchAll]);

  // Realtime — one channel for all three tables, scoped to user
  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel(`data-${user.id}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "sessions", filter: `user_id=eq.${user.id}` },
        () => refetchAll(),
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "projects", filter: `user_id=eq.${user.id}` },
        () => refetchAll(),
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "clients", filter: `user_id=eq.${user.id}` },
        () => refetchAll(),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, refetchAll]);

  // ===== Sessions =====
  const createSession = useCallback(
    async (
      type: SessionType,
      title: string,
      artist: string,
      projectId?: string | null,
    ) => {
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
      } else if (type === "mix") {
        base.checklist = [];
        base.lufs_target = "-14 LUFS";
        base.true_peak_target = "-1 dBTP";
      } else if (type === "live") {
        base.inputs = Array.from({ length: 16 }, (_, i) => ({
          id: uid(),
          ch: i + 1,
          source: "",
          mic: "",
          preamp: "",
          phantom: false,
          pad: false,
          hpf: false,
          notes: "",
          stand: "",
          stageBox: "",
        }));
        base.checklist = [];
        base.monitor_mixes = defaultMonitorMixes();
        base.setlist = [];
        base.show_log = [];
        base.sample_rate = "48 kHz / 24-bit";
      }
      const { data, error } = await supabase
        .from("sessions")
        .insert(base)
        .select()
        .single();
      if (error) throw error;
      const created = sessionFromRow(data);
      setSessions((arr) => [created, ...arr]);
      return created;
    },
    [user],
  );

  const updateSession = useCallback(
    async (
      id: string,
      patch: Partial<Session> | ((s: Session) => Session),
    ) => {
      if (!user) return;
      let row: Partial<Session>;
      if (typeof patch === "function") {
        const current = sessionsRef.current.find((s) => s.id === id);
        if (!current) return;
        const next = patch(current);
        row = next;
        setSessions((arr) => arr.map((s) => (s.id === id ? next : s)));
      } else {
        row = patch;
        setSessions((arr) => arr.map((s) => (s.id === id ? { ...s, ...patch } : s)));
      }
      // Coalesce pending changes; debounce the actual network write
      const merged = {
        ...(pendingPatches.current.get(id) ?? {}),
        ...sessionToRowPatch(row),
      };
      pendingPatches.current.set(id, merged);
      const existing = flushTimers.current.get(id);
      if (existing) clearTimeout(existing);
      flushTimers.current.set(
        id,
        setTimeout(() => flushSession(id), 600),
      );
    },
    [user, flushSession],
  );

  const removeSession = useCallback(
    async (id: string) => {
      // Drop any pending writes for this session
      pendingPatches.current.delete(id);
      const t = flushTimers.current.get(id);
      if (t) {
        clearTimeout(t);
        flushTimers.current.delete(id);
      }
      setSessions((arr) => arr.filter((s) => s.id !== id));
      const { error } = await supabase.from("sessions").delete().eq("id", id);
      if (error) {
        console.error(error);
        refetchAll();
      }
    },
    [refetchAll],
  );

  // ===== Projects =====
  const createProject = useCallback(
    async (name: string, clientId: string | null = null, color = "amber") => {
      if (!user) throw new Error("Not authenticated");
      const { data, error } = await supabase
        .from("projects")
        .insert({ user_id: user.id, name, client_id: clientId, color })
        .select()
        .single();
      if (error) throw error;
      const created = projectFromRow(data);
      setProjects((arr) => [created, ...arr]);
      return created;
    },
    [user],
  );

  const updateProject = useCallback(
    async (
      id: string,
      patch: Partial<Pick<Project, "name" | "notes" | "color" | "clientId">>,
    ) => {
      setProjects((arr) => arr.map((p) => (p.id === id ? { ...p, ...patch } : p)));
      const row: any = { ...patch };
      if ("clientId" in patch) {
        row.client_id = patch.clientId;
        delete row.clientId;
      }
      const { error } = await supabase.from("projects").update(row).eq("id", id);
      if (error) {
        console.error(error);
        refetchAll();
      }
    },
    [refetchAll],
  );

  const removeProject = useCallback(
    async (id: string) => {
      setProjects((arr) => arr.filter((p) => p.id !== id));
      const { error } = await supabase.from("projects").delete().eq("id", id);
      if (error) {
        console.error(error);
        refetchAll();
      }
    },
    [refetchAll],
  );

  // ===== Clients =====
  const createClient = useCallback(
    async (name: string, notes = "") => {
      if (!user) throw new Error("Not authenticated");
      const { data, error } = await supabase
        .from("clients")
        .insert({ user_id: user.id, name, notes })
        .select()
        .single();
      if (error) throw error;
      const created = clientFromRow(data);
      setClients((arr) => [...arr, created].sort((a, b) => a.name.localeCompare(b.name)));
      return created;
    },
    [user],
  );

  const updateClient = useCallback(
    async (id: string, patch: Partial<Pick<Client, "name" | "notes">>) => {
      setClients((arr) => arr.map((c) => (c.id === id ? { ...c, ...patch } : c)));
      const { error } = await supabase.from("clients").update(patch).eq("id", id);
      if (error) {
        console.error(error);
        refetchAll();
      }
    },
    [refetchAll],
  );

  const removeClient = useCallback(
    async (id: string) => {
      setClients((arr) => arr.filter((c) => c.id !== id));
      const { error } = await supabase.from("clients").delete().eq("id", id);
      if (error) {
        console.error(error);
        refetchAll();
      }
    },
    [refetchAll],
  );

  return (
    <Ctx.Provider
      value={{
        loading,
        sessions,
        createSession,
        updateSession,
        removeSession,
        projects,
        createProject,
        updateProject,
        removeProject,
        clients,
        createClient,
        updateClient,
        removeClient,
        refetchAll,
      }}
    >
      {children}
    </Ctx.Provider>
  );
};

export const useData = () => {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useData must be used inside <DataProvider>");
  return ctx;
};