import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { Mic, Sliders, Trash2, ArrowUpRight, Plus, Zap, PenLine, Clock } from "lucide-react";
import { AppShell } from "@/components/console/AppShell";
import { NewSessionDialog } from "@/components/console/NewSessionDialog";
import { useSessions } from "@/lib/store/sessions";
import { cn } from "@/lib/utils";

type Filter = "all" | "recording" | "mix" | "live" | "compose";

const typeMeta = {
  recording: { Icon: Mic, label: "Recording", accent: "text-info", dot: "bg-info", ring: "from-info/20" },
  mix: { Icon: Sliders, label: "Mix", accent: "text-primary", dot: "bg-primary", ring: "from-primary/20" },
  compose: { Icon: PenLine, label: "Compose", accent: "text-accent", dot: "bg-accent", ring: "from-accent/20" },
  live: { Icon: Zap, label: "Live", accent: "text-success", dot: "bg-success", ring: "from-success/20" },
} as const;

const Index = () => {
  const { sessions, remove } = useSessions();
  const [open, setOpen] = useState(false);
  const [filter, setFilter] = useState<Filter>("all");

  const recCount = sessions.filter((s) => s.type === "recording").length;
  const mixCount = sessions.filter((s) => s.type === "mix").length;
  const liveCount = sessions.filter((s) => s.type === "live").length;
  const composeCount = sessions.filter((s) => s.type === "compose").length;

  const visible = useMemo(
    () => {
      const list = filter === "all" ? sessions : sessions.filter((s) => s.type === filter);
      return [...list].sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));
    },
    [sessions, filter],
  );

  const featured = filter === "all" ? visible[0] : null;
  const rest = featured ? visible.slice(1) : visible;

  const filters: { id: Filter; label: string; count: number }[] = [
    { id: "all", label: "All", count: sessions.length },
    { id: "recording", label: "Recording", count: recCount },
    { id: "mix", label: "Mix", count: mixCount },
    { id: "live", label: "Live", count: liveCount },
    { id: "compose", label: "Compose", count: composeCount },
  ];

  return (
    <AppShell>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-10 py-8 sm:py-12">
        <header className="mb-8 flex flex-col md:flex-row md:items-end md:justify-between gap-6">
          <div className="max-w-2xl">
            <div className="flex items-center gap-2 mb-3">
              <span className="led animate-pulse-led" />
              <span className="label-mono tracking-[0.22em]">control room</span>
            </div>
            <h1 className="font-display text-4xl md:text-5xl font-bold tracking-tight leading-[1.05]">
              Your sessions
            </h1>
            <p className="text-muted-foreground mt-3 text-sm sm:text-base leading-relaxed max-w-md">
              A tactile companion for the control room — inputs, takes, checklists, revisions.
            </p>
          </div>
          <button
            onClick={() => setOpen(true)}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-gradient-amber text-primary-foreground px-4 py-2.5 text-sm font-semibold hover:opacity-90 transition shadow-led shrink-0"
          >
            <Plus className="h-4 w-4" strokeWidth={2.5} /> New session
          </button>
        </header>

        <div className="mb-8 flex flex-wrap items-center gap-2">
          {filters.map((f) => {
            const active = filter === f.id;
            return (
              <button
                key={f.id}
                onClick={() => setFilter(f.id)}
                className={cn(
                  "flex items-center gap-2 rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors border",
                  active
                    ? "bg-primary/10 border-primary/40 text-primary"
                    : "border-border text-muted-foreground hover:text-foreground hover:border-foreground/30",
                )}
              >
                {f.label}
                <span className={cn("font-mono text-xs tabular-nums", active ? "text-primary/80" : "text-muted-foreground/70")}>
                  {f.count}
                </span>
              </button>
            );
          })}
        </div>

        {visible.length === 0 ? (
          <EmptyState onNew={() => setOpen(true)} filtered={sessions.length > 0} />
        ) : (
          <div className="space-y-5">
            {featured && <FeaturedCard session={featured} onDelete={() => remove(featured.id)} />}
            {rest.length > 0 && (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {rest.map((s) => (
                  <SessionCard key={s.id} session={s} onDelete={() => remove(s.id)} />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
      <NewSessionDialog open={open} onOpenChange={setOpen} />
    </AppShell>
  );
};

function getMetrics(s: any) {
  return s.type === "recording"
    ? [
        { label: "Inputs", value: s.inputs?.length ?? 0 },
        { label: "Takes", value: s.takes?.length ?? 0 },
        { label: "Keepers", value: s.takes?.filter((t: any) => t.rating === "keeper").length ?? 0 },
      ]
    : s.type === "mix"
    ? [
        { label: "Checks", value: `${s.checklist?.filter((c: any) => c.done).length ?? 0}/${s.checklist?.length ?? 0}` },
        { label: "Revs", value: s.revisions?.length ?? 0 },
        { label: "Refs", value: s.references?.length ?? 0 },
      ]
    : s.type === "compose"
    ? [
        { label: "Sections", value: s.structure?.length ?? 0 },
        { label: "Ideas", value: s.ideas?.length ?? 0 },
        { label: "Lyrics", value: (s.lyrics ?? "").trim() ? "✓" : "—" },
      ]
    : [
        { label: "Channels", value: s.inputs?.length ?? 0 },
        { label: "Songs", value: s.setlist?.length ?? 0 },
        { label: "Cues", value: s.showLog?.length ?? 0 },
      ];
}

function FeaturedCard({ session: s, onDelete }: { session: any; onDelete: () => void }) {
  const meta = typeMeta[s.type as keyof typeof typeMeta];
  const { Icon } = meta;
  const metrics = getMetrics(s);
  return (
    <div className="group relative rounded-xl border border-border/80 bg-surface-1 overflow-hidden animate-fade-in panel-interactive">
      <div className={cn("absolute inset-0 bg-gradient-to-br opacity-50 pointer-events-none", meta.ring, "to-transparent")} />
      <div className="relative grid md:grid-cols-[1fr_auto] gap-6 p-6 md:p-7">
        <Link to={`/session/${s.id}`} className="min-w-0 block">
          <div className="flex items-center gap-2 mb-4">
            <span className={cn("h-1.5 w-1.5 rounded-full", meta.dot)} />
            <span className="label-mono">latest · {meta.label.toLowerCase()}</span>
          </div>
          <div className="flex items-start gap-4">
            <div className={cn("h-12 w-12 rounded-lg bg-surface-2 grid place-items-center shrink-0", meta.accent)}>
              <Icon className="h-6 w-6" strokeWidth={1.5} />
            </div>
            <div className="min-w-0">
              <h2 className="font-display font-bold text-2xl md:text-3xl tracking-tight truncate">
                {s.title}
              </h2>
              <div className="text-sm text-muted-foreground truncate mt-1">{s.artist || "—"}</div>
            </div>
          </div>
        </Link>
        <div className="flex md:flex-col items-start md:items-end justify-between md:justify-center gap-4 md:border-l md:border-border/60 md:pl-6">
          <div className="flex md:flex-col gap-4 md:gap-3 md:text-right">
            {metrics.map((m) => (
              <div key={m.label}>
                <div className="font-mono text-xl tabular-nums">{m.value}</div>
                <div className="label-mono mt-0.5">{m.label}</div>
              </div>
            ))}
          </div>
          <div className="font-mono text-[10px] text-muted-foreground flex items-center gap-1.5">
            <Clock className="h-3 w-3" />
            {new Date(s.createdAt).toLocaleDateString()}
          </div>
        </div>
      </div>
      <button
        onClick={(e) => { e.preventDefault(); if (confirm(`Delete "${s.title}"?`)) onDelete(); }}
        aria-label="Delete session"
        className="absolute top-3 right-3 p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-surface-2 opacity-0 group-hover:opacity-100 transition z-10"
      >
        <Trash2 className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

function SessionCard({ session: s, onDelete }: { session: any; onDelete: () => void }) {
  const meta = typeMeta[s.type as keyof typeof typeMeta];
  const { Icon } = meta;
  const metrics = getMetrics(s).slice(0, 2);
  return (
    <div className="group relative rounded-xl border border-border/80 bg-surface-1 hover:-translate-y-0.5 transition-all duration-200 animate-fade-in panel-interactive">
      <Link to={`/session/${s.id}`} className="block p-5">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <span className={cn("h-1.5 w-1.5 rounded-full", meta.dot)} />
            <span className="label-mono">{meta.label}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-[10px] text-muted-foreground tabular-nums">
              {new Date(s.createdAt).toLocaleDateString()}
            </span>
            <ArrowUpRight className="h-3.5 w-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 group-hover:text-primary transition" />
          </div>
        </div>
        <div className="flex items-start gap-3 mb-6">
          <div className={cn("h-9 w-9 rounded-lg bg-surface-2 grid place-items-center shrink-0 transition-colors", meta.accent)}>
            <Icon className="h-4.5 w-4.5" strokeWidth={1.5} />
          </div>
          <div className="min-w-0 flex-1">
            <div className="font-display font-semibold text-base leading-snug truncate">{s.title}</div>
            <div className="text-xs text-muted-foreground truncate mt-0.5">{s.artist || "—"}</div>
          </div>
        </div>
        <div className="flex gap-5 border-t border-border/60 pt-3">
          {metrics.map((m) => (
            <div key={m.label}>
              <div className="font-mono text-sm tabular-nums">{m.value}</div>
              <div className="label-mono mt-0.5">{m.label}</div>
            </div>
          ))}
        </div>
      </Link>
      <button
        onClick={(e) => { e.preventDefault(); if (confirm(`Delete "${s.title}"?`)) onDelete(); }}
        aria-label="Delete session"
        className="absolute top-2.5 right-2.5 p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-surface-2 opacity-0 group-hover:opacity-100 transition"
      >
        <Trash2 className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

function EmptyState({ onNew, filtered = false }: { onNew: () => void; filtered?: boolean }) {
  return (
    <div className="rounded-xl border border-dashed border-border bg-surface-1/40 p-12 text-center">
      <div className="inline-flex items-center gap-2 mb-4">
        <span className="led animate-pulse-led" />
        <span className="label-mono">{filtered ? "no matches" : "awaiting signal"}</span>
      </div>
      <h2 className="font-display text-2xl font-semibold mb-2">
        {filtered ? "Nothing in this filter." : "No sessions in the rack."}
      </h2>
      <p className="text-muted-foreground text-sm max-w-md mx-auto mb-6">
        {filtered
          ? "Try a different type or clear the filter to see everything."
          : "Create your first session to start tracking inputs, takes, mix checklists and client revisions."}
      </p>
      <button onClick={onNew}
        className="inline-flex items-center gap-2 rounded-lg bg-primary text-primary-foreground px-4 py-2.5 text-sm font-semibold hover:bg-primary/90 transition shadow-led">
        <Plus className="h-4 w-4" /> New session
      </button>
    </div>
  );
}

export default Index;
