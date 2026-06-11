import { Plus, Trash2, Guitar } from "lucide-react";
import { useSession, helpers } from "@/lib/store/sessions";
import type { Session, InstrumentationItem } from "@/lib/types";

export function Instrumentation({ session }: { session: Session }) {
  const { update } = useSession(session.id);
  const items = session.instrumentation ?? [];

  const setItems = (fn: (i: InstrumentationItem[]) => InstrumentationItem[]) =>
    update(session.id, (s) => ({ ...s, instrumentation: fn(s.instrumentation ?? []) }));

  const add = () =>
    setItems((arr) => [...arr, { id: helpers.uid(), name: "", role: "", patch: "", notes: "" }]);

  const setField = <K extends keyof InstrumentationItem>(id: string, field: K, value: InstrumentationItem[K]) =>
    setItems((arr) => arr.map((i) => (i.id === id ? { ...i, [field]: value } : i)));

  return (
    <div className="panel">
      <div className="panel-header">
        <div className="panel-icon">
          <Guitar className="h-4 w-4" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="panel-title">Instrumentation</div>
          <div className="panel-subtitle">{items.length} parts</div>
        </div>
        <button onClick={add}
          className="flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg bg-surface-2 hover:bg-surface-3 transition shrink-0">
          <Plus className="h-3.5 w-3.5" /> Part
        </button>
      </div>
      <div className="divide-y divide-border/60">
        {items.map((it) => (
          <div key={it.id} className="p-3 grid grid-cols-12 gap-2 items-center">
            <input
              value={it.name}
              onChange={(e) => setField(it.id, "name", e.target.value)}
              placeholder="Instrument (e.g. Rhodes)"
              className="col-span-4 bg-input border border-border rounded-sm px-2 py-1.5 text-sm outline-none focus:ring-1 focus:ring-primary"
            />
            <input
              value={it.role}
              onChange={(e) => setField(it.id, "role", e.target.value)}
              placeholder="Role (pad, lead, rhythm)"
              className="col-span-3 bg-input border border-border rounded-sm px-2 py-1.5 text-xs font-mono outline-none focus:ring-1 focus:ring-primary"
            />
            <input
              value={it.patch}
              onChange={(e) => setField(it.id, "patch", e.target.value)}
              placeholder="Patch / plugin"
              className="col-span-3 bg-input border border-border rounded-sm px-2 py-1.5 text-xs font-mono outline-none focus:ring-1 focus:ring-primary"
            />
            <input
              value={it.notes}
              onChange={(e) => setField(it.id, "notes", e.target.value)}
              placeholder="Notes"
              className="col-span-2 bg-transparent border border-dashed border-border rounded-sm px-2 py-1.5 text-xs outline-none focus:ring-1 focus:ring-primary focus:border-solid"
            />
            <div className="col-span-12 flex justify-end -mt-1">
              <button onClick={() => setItems((arr) => arr.filter((x) => x.id !== it.id))}
                className="text-muted-foreground hover:text-destructive p-1" aria-label="Delete">
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        ))}
        {items.length === 0 && (
          <div className="px-4 py-8 text-center text-muted-foreground text-sm">
            No parts yet. List what's in the song.
          </div>
        )}
      </div>
    </div>
  );
}