import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft, Plus, Mic, Sliders, Trash2, ArrowUpRight } from "lucide-react";
import { AppShell } from "@/components/console/AppShell";
import { useProjects } from "@/lib/store/projects";
import { useClients } from "@/lib/store/clients";
import { useSessions } from "@/lib/store/sessions";
import { NewSessionDialog } from "@/components/console/NewSessionDialog";
import { cn } from "@/lib/utils";

const ProjectView = () => {
  const { id } = useParams<{ id: string }>();
  const { projects, update } = useProjects();
  const { clients } = useClients();
  const { sessions, remove } = useSessions(id);
  const [open, setOpen] = useState(false);
  const project = projects.find((p) => p.id === id);

  if (!project) {
    return (
      <AppShell>
        <div className="p-10 text-center text-muted-foreground">
          <Link to="/projects" className="text-xs hover:text-foreground inline-flex items-center gap-1 mb-4">
            <ArrowLeft className="h-3.5 w-3.5" /> Projects
          </Link>
          <div>Project not found.</div>
        </div>
      </AppShell>
    );
  }

  const recCount = sessions.filter((s) => s.type === "recording").length;
  const mixCount = sessions.filter((s) => s.type === "mix").length;

  return (
    <AppShell>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-10 py-6 sm:py-8">
        <Link to="/projects" className="text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1 mb-4">
          <ArrowLeft className="h-3.5 w-3.5" /> Projects
        </Link>

        <header className="mb-8">
          <div className="label-mono mb-2">// project</div>
          <input value={project.name} onChange={(e) => update(project.id, { name: e.target.value })}
            className="font-display text-3xl md:text-4xl font-bold tracking-tight bg-transparent outline-none focus:bg-surface-2 rounded-sm px-1 -ml-1 w-full" />
          <div className="mt-2 flex flex-wrap items-center gap-3">
            <select value={project.clientId ?? ""} onChange={(e) => update(project.id, { clientId: e.target.value || null })}
              className="bg-surface-2 border border-border rounded-sm px-2 py-1 text-xs outline-none">
              <option value="">— No client —</option>
              {clients.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <div className="flex items-center gap-1.5"><Mic className="h-3.5 w-3.5 text-info" /><span className="font-mono text-sm">{recCount}</span><span className="label-mono">rec</span></div>
            <div className="flex items-center gap-1.5"><Sliders className="h-3.5 w-3.5 text-primary" /><span className="font-mono text-sm">{mixCount}</span><span className="label-mono">mix</span></div>
            <button onClick={() => setOpen(true)} className="ml-auto flex items-center gap-1.5 rounded-sm bg-gradient-amber text-primary-foreground px-3 py-1.5 text-sm font-semibold">
              <Plus className="h-4 w-4" /> Session
            </button>
          </div>
        </header>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {sessions.map((s) => {
            const Icon = s.type === "recording" ? Mic : Sliders;
            const accent = s.type === "recording" ? "text-info" : "text-primary";
            const counts = s.type === "recording"
              ? `${s.inputs?.length ?? 0} inputs · ${s.takes?.length ?? 0} takes`
              : `${s.checklist?.filter((c) => c.done).length ?? 0}/${s.checklist?.length ?? 0} checks · ${s.revisions?.length ?? 0} revs`;
            return (
              <div key={s.id} className="panel p-4 group hover:border-primary/40 relative">
                <div className="flex items-start gap-3">
                  <div className={cn("h-9 w-9 rounded-sm bg-surface-2 grid place-items-center", accent)}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <Link to={`/session/${s.id}`} className="block">
                      <div className="font-display font-semibold truncate group-hover:text-primary">{s.title}</div>
                      <div className="text-xs text-muted-foreground truncate">{s.artist}</div>
                    </Link>
                  </div>
                  <Link to={`/session/${s.id}`} className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-primary">
                    <ArrowUpRight className="h-4 w-4" />
                  </Link>
                </div>
                <div className="mt-4 flex items-center justify-between">
                  <div className="label-mono">{counts}</div>
                  <div className="font-mono text-[10px] text-muted-foreground">{new Date(s.createdAt).toLocaleDateString()}</div>
                </div>
                <button onClick={() => { if (confirm(`Delete "${s.title}"?`)) remove(s.id); }}
                  className="absolute top-2 right-2 p-1 rounded-sm text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100">
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            );
          })}
          {sessions.length === 0 && (
            <div className="panel p-10 text-center text-muted-foreground text-sm sm:col-span-2 lg:col-span-3">
              No sessions in this project yet.
            </div>
          )}
        </div>
      </div>
      <NewSessionDialog open={open} onOpenChange={setOpen} defaultProjectId={id} />
    </AppShell>
  );
};

export default ProjectView;
