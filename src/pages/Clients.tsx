import { useState } from "react";
import { Plus, Trash2, Users } from "lucide-react";
import { AppShell } from "@/components/console/AppShell";
import { useClients } from "@/lib/store/clients";
import { useProjects } from "@/lib/store/projects";

const Clients = () => {
  const { clients, create, update, remove } = useClients();
  const { projects } = useProjects();
  const [name, setName] = useState("");

  const add = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    await create(name.trim());
    setName("");
  };

  return (
    <AppShell>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-10 py-6 sm:py-10">
        <div className="label-mono mb-3">// roster</div>
        <h1 className="font-display text-4xl font-bold tracking-tight mb-8">Clients<span className="text-primary">.</span></h1>

        <form onSubmit={add} className="panel p-3 flex gap-2 mb-6">
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="New client / band name"
            className="flex-1 bg-input border border-border rounded-sm px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary" />
          <button className="rounded-sm bg-gradient-amber text-primary-foreground px-4 py-2 text-sm font-semibold flex items-center gap-1.5">
            <Plus className="h-4 w-4" /> Add
          </button>
        </form>

        <div className="panel divide-y divide-border/60">
          {clients.map((c) => {
            const count = projects.filter((p) => p.clientId === c.id).length;
            return (
              <div key={c.id} className="p-4 flex items-center gap-3 group hover:bg-surface-2/40">
                <div className="h-9 w-9 rounded-sm bg-surface-2 grid place-items-center text-primary">
                  <Users className="h-4 w-4" />
                </div>
                <input value={c.name} onChange={(e) => update(c.id, { name: e.target.value })}
                  className="flex-1 font-display font-semibold bg-transparent outline-none focus:bg-surface-2 rounded-sm px-2 py-1" />
                <span className="label-mono">{count} projects</span>
                <button onClick={() => { if (confirm(`Delete "${c.name}"?`)) remove(c.id); }}
                  className="text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            );
          })}
          {clients.length === 0 && <div className="p-10 text-center text-muted-foreground text-sm">No clients yet.</div>}
        </div>
      </div>
    </AppShell>
  );
};

export default Clients;
