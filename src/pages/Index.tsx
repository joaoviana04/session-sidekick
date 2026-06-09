import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { Mic, Sliders, Trash2, ArrowUpRight, Plus, Zap, PenLine } from "lucide-react";
import { AppShell } from "@/components/console/AppShell";
import { NewSessionDialog } from "@/components/console/NewSessionDialog";
import { useSessions } from "@/lib/store/sessions";
import { cn } from "@/lib/utils";

type Filter = "all" | "recording" | "mix" | "live" | "compose";

const Index = () => {
  const { sessions, remove } = useSessions();
  const [open, setOpen] = useState(false);
  const [filter, setFilter] = useState<Filter>("all");

  const recCount = sessions.filter((s) => s.type === "recording").length;
  const mixCount = sessions.filter((s) => s.type === "mix").length;
  const liveCount = sessions.filter((s) => s.type === "live").length;
  const composeCount = sessions.filter((s) => s.type === "compose").length;

  const visible = useMemo(
    () => (filter === "all" ? sessions : sessions.filter((s) => s.type === filter)),
    [sessions, filter],
  );

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
        <header className="mb-12 max-w-2xl">
          <div className="label-mono mb-3 tracking-[0.2em]">// control room</div>
          <h1 className="font-display text-5xl md:text-6xl font-bold tracking-tight leading-none">
            Sessions<span className="text-primary">.</span>
          </h1>
          <p className="text-muted-foreground mt-5 text-base sm:text-lg font-light leading-relaxed">
            A tactile companion for the control room. Track inputs and takes while recording, run checklists and revisions.
          </p>
        </header>

        <div className="mb-10 flex flex-wrap items-center justify-between gap-4 border-b border-border/60 pb-5">
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 font-mono text-[11px] tracking-widest uppercase">
            {filters.map((f) => {
              const active = filter === f.id;
              return (
                <button
                  key={f.id}
                  onClick={() => setFilter(f.id)}
                  className={cn(
                    "pb-1.5 -mb-px border-b transition-colors flex items-center gap-1.5",
                    active
                      ? "text-primary border-primary"
                      : "text-muted-foreground border-transparent hover:text-foreground",
                  )}
                >
                  <span className={cn("tabular-nums", active ? "text-primary" : "text-foreground/80")}>
                    {f.count}
                  </span>
                  {f.label}
                </button>
              );
            })}
          </div>
          <button
            onClick={() => setOpen(true)}
            className="flex items-center gap-2 rounded-sm bg-primary text-primary-foreground px-4 py-2 text-xs font-bold uppercase tracking-wider hover:bg-primary/90 transition shadow-led"
          >
            <Plus className="h-4 w-4" strokeWidth={3} /> New session
          </button>
        </div>

        {visible.length === 0 ? (
          <EmptyState onNew={() => setOpen(true)} filtered={sessions.length > 0} />
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {visible.map((s) => {
              const Icon =
                s.type === "recording" ? Mic
                : s.type === "mix" ? Sliders
                : s.type === "compose" ? PenLine
                : Zap;
              const metrics: { label: string; value: string | number }[] =
                s.type === "recording"
                  ? [
                      { label: "Inputs", value: s.inputs?.length ?? 0 },
                      { label: "Takes", value: s.takes?.length ?? 0 },
                    ]
                  : s.type === "mix"
                  ? [
                      { label: "Checks", value: `${s.checklist?.filter((c) => c.done).length ?? 0}/${s.checklist?.length ?? 0}` },
                      { label: "Revs", value: s.revisions?.length ?? 0 },
                    ]
                  : s.type === "compose"
                  ? [
                      { label: "Sections", value: s.structure?.length ?? 0 },
                      { label: "Ideas", value: s.ideas?.length ?? 0 },
                    ]
                  : [
                      { label: "Channels", value: s.inputs?.length ?? 0 },
                      { label: "Songs", value: s.setlist?.length ?? 0 },
                    ];

              return (
                <div
                  key={s.id}
                  className="group relative rounded-md border border-border/50 bg-surface-1/40 hover:border-primary/40 hover:bg-surface-1/70 p-5 transition-all animate-fade-in"
                >
                  <Link to={`/session/${s.id}`} className="block">
                    <div className="flex items-start gap-4 mb-8">
                      <div className="h-10 w-10 rounded-sm bg-surface-2/60 grid place-items-center text-muted-foreground group-hover:text-primary transition-colors shrink-0">
                        <Icon className="h-5 w-5" strokeWidth={1.5} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="font-display font-semibold text-lg truncate text-foreground">
                          {s.title}
                        </div>
                        <div className="text-xs text-muted-foreground truncate mt-0.5">
                          {s.artist || "—"}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-end justify-between">
                      <div className="flex gap-5">
                        {metrics.map((m) => (
                          <div key={m.label} className="flex flex-col gap-0.5">
                            <span className="label-mono">{m.label}</span>
                            <span className="font-mono text-sm text-foreground tabular-nums">{m.value}</span>
                          </div>
                        ))}
                      </div>
                      <div className="font-mono text-[10px] text-muted-foreground tabular-nums">
                        {new Date(s.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                  </Link>
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      if (confirm(`Delete "${s.title}"?`)) remove(s.id);
                    }}
                    aria-label="Delete session"
                    className="absolute top-2.5 right-2.5 p-1.5 rounded-sm text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
      <NewSessionDialog open={open} onOpenChange={setOpen} />
    </AppShell>
  );
};

function EmptyState({ onNew, filtered = false }: { onNew: () => void; filtered?: boolean }) {
  return (
    <div className="rounded-md border border-border/60 bg-surface-1/30 p-12 text-center">
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
        className="inline-flex items-center gap-2 rounded-sm bg-primary text-primary-foreground px-4 py-2.5 text-sm font-semibold hover:bg-primary/90 transition shadow-led">
        <Plus className="h-4 w-4" /> New session
      </button>
    </div>
  );
}

export default Index;
