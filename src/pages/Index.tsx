import { useState } from "react";
import { Link } from "react-router-dom";
import { Mic, Sliders, Trash2, ArrowUpRight, Plus, Zap } from "lucide-react";
import { AppShell } from "@/components/console/AppShell";
import { NewSessionDialog } from "@/components/console/NewSessionDialog";
import { useSessions } from "@/lib/store/sessions";
import { cn } from "@/lib/utils";

const Index = () => {
  const { sessions, remove } = useSessions();
  const [open, setOpen] = useState(false);

  const recCount = sessions.filter((s) => s.type === "recording").length;
  const mixCount = sessions.filter((s) => s.type === "mix").length;
  const liveCount = sessions.filter((s) => s.type === "live").length;

  return (
    <AppShell>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-10 py-6 sm:py-10">
        <header className="mb-10">
          <div className="label-mono mb-3">// control room</div>
          <h1 className="font-display text-4xl md:text-5xl font-bold tracking-tight">
            Sessions<span className="text-primary">.</span>
          </h1>
          <p className="text-muted-foreground mt-2 max-w-xl">
            A tactile companion for the control room. Track inputs and takes while recording, run a checklist and revisions while mixing.
          </p>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <button onClick={() => setOpen(true)}
              className="flex items-center gap-2 rounded-sm bg-gradient-amber text-primary-foreground px-4 py-2.5 text-sm font-semibold hover:opacity-90 transition shadow-led">
              <Plus className="h-4 w-4" /> New session
            </button>
            <div className="flex items-center gap-4 ml-2">
              <Stat label="Recording" value={recCount} icon={<Mic className="h-3.5 w-3.5 text-info" />} />
              <Stat label="Mix" value={mixCount} icon={<Sliders className="h-3.5 w-3.5 text-primary" />} />
              <Stat label="Live" value={liveCount} icon={<Zap className="h-3.5 w-3.5 text-success" />} />
              <Stat label="Total" value={sessions.length} />
            </div>
          </div>
        </header>

        {sessions.length === 0 ? (
          <EmptyState onNew={() => setOpen(true)} />
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {sessions.map((s) => {
              const Icon = s.type === "recording" ? Mic : s.type === "mix" ? Sliders : Zap;
              const accent = s.type === "recording" ? "text-info" : s.type === "mix" ? "text-primary" : "text-success";
              const counts =
                s.type === "recording"
                  ? `${s.inputs?.length ?? 0} inputs · ${s.takes?.length ?? 0} takes`
                  : s.type === "mix"
                  ? `${s.checklist?.filter((c) => c.done).length ?? 0}/${s.checklist?.length ?? 0} checks · ${s.revisions?.length ?? 0} revs`
                  : `${s.inputs?.length ?? 0} ch · ${s.setlist?.length ?? 0} songs · ${s.monitorMixes?.length ?? 0} mixes`;

              return (
                <div key={s.id} className="panel p-4 group hover:border-primary/40 transition-all relative animate-fade-in">
                  <div className="flex items-start gap-3">
                    <div className={cn("h-9 w-9 rounded-sm bg-surface-2 grid place-items-center shrink-0", accent)}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <Link to={`/session/${s.id}`} className="block">
                        <div className="font-display font-semibold truncate group-hover:text-primary transition-colors">{s.title}</div>
                        <div className="text-xs text-muted-foreground truncate">{s.artist}</div>
                      </Link>
                    </div>
                    <Link to={`/session/${s.id}`} className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-primary transition">
                      <ArrowUpRight className="h-4 w-4" />
                    </Link>
                  </div>
                  <div className="mt-4 flex items-center justify-between">
                    <div className="label-mono">{counts}</div>
                    <div className="font-mono text-[10px] text-muted-foreground">
                      {new Date(s.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                  <button onClick={() => { if (confirm(`Delete "${s.title}"?`)) remove(s.id); }}
                    className="absolute top-2 right-2 p-1 rounded-sm text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition">
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

function Stat({ label, value, icon }: { label: string; value: number; icon?: React.ReactNode }) {
  return (
    <div className="flex items-center gap-1.5">
      {icon}
      <span className="font-mono text-sm text-foreground tabular-nums">{value}</span>
      <span className="label-mono">{label}</span>
    </div>
  );
}

function EmptyState({ onNew }: { onNew: () => void }) {
  return (
    <div className="panel p-12 text-center">
      <div className="inline-flex items-center gap-2 mb-4">
        <span className="led animate-pulse-led" />
        <span className="label-mono">awaiting signal</span>
      </div>
      <h2 className="font-display text-2xl font-semibold mb-2">No sessions in the rack.</h2>
      <p className="text-muted-foreground text-sm max-w-md mx-auto mb-6">
        Create your first session to start tracking inputs, takes, mix checklists and client revisions.
      </p>
      <button onClick={onNew}
        className="inline-flex items-center gap-2 rounded-sm bg-gradient-amber text-primary-foreground px-4 py-2.5 text-sm font-semibold hover:opacity-90">
        <Plus className="h-4 w-4" /> New session
      </button>
    </div>
  );
}

export default Index;
