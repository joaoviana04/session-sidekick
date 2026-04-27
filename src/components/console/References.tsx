import { Plus, Trash2, Music } from "lucide-react";
import { useSession, helpers } from "@/lib/store/sessions";
import type { Session } from "@/lib/types";

export function References({ session }: { session: Session }) {
  const { update } = useSession(session.id);
  const refs = session.references ?? [];

  const setRefs = (fn: (r: typeof refs) => typeof refs) =>
    update(session.id, (s) => ({ ...s, references: fn(s.references ?? []) }));

  return (
    <div className="panel">
      <div className="px-4 py-3 border-b border-border flex items-center justify-between">
        <div>
          <div className="font-display font-semibold">Reference Tracks</div>
          <div className="label-mono mt-0.5">A/B targets - gain match before comparing</div>
        </div>
        <button onClick={() => setRefs((arr) => [...arr, helpers.newReference()])}
          className="flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-sm bg-surface-2 hover:bg-surface-3">
          <Plus className="h-3.5 w-3.5" /> Add
        </button>
      </div>
      <div className="divide-y divide-border/60">
        {refs.map((r) => (
          <div key={r.id} className="p-3 grid grid-cols-12 gap-2 items-start group hover:bg-surface-2/40">
            <Music className="h-4 w-4 text-primary mt-2 col-span-1" />
            <input value={r.title} onChange={(e) => setRefs((a) => a.map((x) => x.id === r.id ? { ...x, title: e.target.value } : x))}
              placeholder="Track title" className="col-span-4 bg-transparent px-2 py-1 rounded-sm hover:bg-surface-2 focus:bg-surface-2 outline-none focus:ring-1 focus:ring-primary text-sm font-medium" />
            <input value={r.artist} onChange={(e) => setRefs((a) => a.map((x) => x.id === r.id ? { ...x, artist: e.target.value } : x))}
              placeholder="Artist" className="col-span-3 bg-transparent px-2 py-1 rounded-sm hover:bg-surface-2 focus:bg-surface-2 outline-none focus:ring-1 focus:ring-primary text-sm text-muted-foreground" />
            <input value={r.lufs} onChange={(e) => setRefs((a) => a.map((x) => x.id === r.id ? { ...x, lufs: e.target.value } : x))}
              placeholder="LUFS" className="col-span-2 bg-transparent px-2 py-1 rounded-sm hover:bg-surface-2 focus:bg-surface-2 outline-none focus:ring-1 focus:ring-primary text-sm font-mono" />
            <button onClick={() => setRefs((a) => a.filter((x) => x.id !== r.id))}
              className="col-span-2 justify-self-end text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 p-1">
              <Trash2 className="h-3.5 w-3.5" />
            </button>
            <textarea value={r.notes} onChange={(e) => setRefs((a) => a.map((x) => x.id === r.id ? { ...x, notes: e.target.value } : x))}
              placeholder="What to learn from this ref"
              rows={1}
              className="col-span-12 col-start-2 bg-transparent px-2 py-1 rounded-sm hover:bg-surface-2 focus:bg-surface-2 outline-none focus:ring-1 focus:ring-primary text-xs resize-none" />
          </div>
        ))}
        {refs.length === 0 && <div className="p-8 text-center text-muted-foreground text-sm">No references yet.</div>}
      </div>
    </div>
  );
}