import { useState } from "react";
import { Link } from "react-router-dom";
import { Plus, Folder, ArrowUpRight, Trash2 } from "lucide-react";
import { AppShell } from "@/components/console/AppShell";
import { useProjects } from "@/lib/store/projects";
import { useClients } from "@/lib/store/clients";
import { useSessions } from "@/lib/store/sessions";

const Projects = () => {
  const { projects, create, remove } = useProjects();
  const { clients } = useClients();
  const { sessions } = useSessions();
  const [name, setName] = useState("");
  const [clientId, setClientId] = useState<string>("");

  const add = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    await create(name.trim(), clientId || null);
    setName(""); setClientId("");
  };

  return (
    <AppShell>
      <div className="max-w-6xl mx-auto px-6 lg:px-10 py-10">
        <div className="label-mono mb-3">// catalog</div>
        <h1 className="font-display text-4xl font-bold tracking-tight mb-8">Projects<span className="text-primary">.</span></h1>

        <form onSubmit={add} className="panel p-3 flex flex-wrap gap-2 mb-6">
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Project name (e.g. EP — Band X)"
            className="flex-1 min-w-[200px] bg-input border border-border rounded-sm px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary" />
          <select value={clientId} onChange={(e) => setClientId(e.target.value)}
            className="bg-input border border-border rounded-sm px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary">
            <option value="">— No client —</option>
            {clients.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <button className="rounded-sm bg-gradient-amber text-primary-foreground px-4 py-2 text-sm font-semibold flex items-center gap-1.5">
            <Plus className="h-4 w-4" /> Add
          </button>
        </form>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.map((p) => {
            const count = sessions.filter((s) => s.projectId === p.id).length;
            const client = clients.find((c) => c.id === p.clientId);
            return (
              <div key={p.id} className="panel p-4 group hover:border-primary/40 transition relative">
                <div className="flex items-start gap-3">
                  <div className="h-9 w-9 rounded-sm bg-surface-2 grid place-items-center text-primary">
                    <Folder className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <Link to={`/projects/${p.id}`} className="block">
                      <div className="font-display font-semibold truncate group-hover:text-primary">{p.name}</div>
                      <div className="text-xs text-muted-foreground truncate">{client?.name ?? "No client"}</div>
                    </Link>
                  </div>
                  <Link to={`/projects/${p.id}`} className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-primary">
                    <ArrowUpRight className="h-4 w-4" />
                  </Link>
                </div>
                <div className="mt-4 flex items-center justify-between">
                  <div className="label-mono">{count} sessions</div>
                  <div className="font-mono text-[10px] text-muted-foreground">{new Date(p.createdAt).toLocaleDateString()}</div>
                </div>
                <button onClick={() => { if (confirm(`Delete "${p.name}"? Sessions will become loose.`)) remove(p.id); }}
                  className="absolute top-2 right-2 p-1 rounded-sm text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100">
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            );
          })}
          {projects.length === 0 && (
            <div className="panel p-10 text-center text-muted-foreground text-sm sm:col-span-2 lg:col-span-3">
              No projects yet. Create one to group your sessions.
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
};

export default Projects;
