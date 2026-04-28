import { Plus, Trash2 } from "lucide-react";
import { useSession, helpers } from "@/lib/store/sessions";
import type { Session, RevisionStatus } from "@/lib/types";
import { cn } from "@/lib/utils";

const statusColors: Record<RevisionStatus, string> = {
  draft: "bg-surface-3 text-muted-foreground border-border",
  sent: "bg-info/20 text-info border-info/30",
  approved: "bg-success/20 text-success border-success/30",
  revise: "bg-primary/20 text-primary border-primary/30",
};

export function Revisions({ session }: { session: Session }) {
  const { update } = useSession(session.id);
  const revs = session.revisions ?? [];

  const setRevs = (fn: (r: typeof revs) => typeof revs) =>
    update(session.id, (s) => ({ ...s, revisions: fn(s.revisions ?? []) }));

  const addRev = () => {
    const v = `v${revs.length + 1}`;
    setRevs((arr) => [helpers.newRevision(v), ...arr]);
  };

  return (
    <div className="panel">
      <div className="px-4 py-3 border-b border-border flex items-center justify-between">
        <div>
          <div className="font-display font-semibold">Revisions</div>
          <div className="label-mono mt-0.5">Client feedback log</div>
        </div>
        <button onClick={addRev} className="flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-sm bg-gradient-amber text-primary-foreground font-semibold">
          <Plus className="h-3.5 w-3.5" /> Revision
        </button>
      </div>
      <div className="divide-y divide-border/60 max-h-[600px] overflow-auto">
        {revs.map((r) => (
          <div key={r.id} className="p-4 group hover:bg-surface-2/40">
            <div className="flex items-center gap-3 mb-2">
              <input value={r.version} onChange={(e) => setRevs((a) => a.map((x) => x.id === r.id ? { ...x, version: e.target.value } : x))}
                className="w-16 font-mono text-lg font-bold text-primary bg-transparent outline-none focus:bg-surface-2 rounded-sm px-1" />
              <span className="text-xs text-muted-foreground font-mono">
                {new Date(r.date).toLocaleDateString()}
              </span>
              <div className="ml-auto flex items-center gap-1">
                {(["draft", "sent", "revise", "approved"] as RevisionStatus[]).map((st) => (
                  <button key={st} onClick={() => setRevs((a) => a.map((x) => x.id === r.id ? { ...x, status: st } : x))}
                    className={cn(
                      "text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-sm border transition",
                      r.status === st ? statusColors[st] : "border-transparent text-muted-foreground hover:bg-surface-2"
                    )}>{st}</button>
                ))}
                <button onClick={() => setRevs((a) => a.filter((x) => x.id !== r.id))}
                  className="text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 p-1 ml-1">
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
            <div className="grid md:grid-cols-2 gap-3">
              <div>
                <div className="label-mono mb-1">Client feedback</div>
                <textarea value={r.feedback} onChange={(e) => setRevs((a) => a.map((x) => x.id === r.id ? { ...x, feedback: e.target.value } : x))}
                  rows={3} placeholder="Vocal too loud..."
                  className="w-full bg-input border border-border rounded-sm p-2 text-sm outline-none focus:ring-1 focus:ring-primary resize-none" />
              </div>
              <div>
                <div className="label-mono mb-1">Changes made</div>
                <textarea value={r.changes} onChange={(e) => setRevs((a) => a.map((x) => x.id === r.id ? { ...x, changes: e.target.value } : x))}
                  rows={3} placeholder="-2 dB lead vox..."
                  className="w-full bg-input border border-border rounded-sm p-2 text-sm outline-none focus:ring-1 focus:ring-primary resize-none" />
              </div>
            </div>
          </div>
        ))}
        {revs.length === 0 && <div className="p-8 text-center text-muted-foreground text-sm">No revisions logged.</div>}
      </div>
    </div>
  );
}
