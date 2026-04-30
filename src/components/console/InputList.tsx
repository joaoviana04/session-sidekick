import { Plus, Trash2 } from "lucide-react";
import { useSession, helpers } from "@/lib/store/sessions";
import type { Session } from "@/lib/types";
import { cn } from "@/lib/utils";

export function InputList({ session }: { session: Session }) {
  const { update } = useSession(session.id);
  const inputs = session.inputs ?? [];

  const setInputs = (fn: (i: typeof inputs) => typeof inputs) =>
    update(session.id, (s) => ({ ...s, inputs: fn(s.inputs ?? []) }));

  const toggle = (id: string, flag: "phantom" | "pad" | "hpf") =>
    setInputs((arr) => arr.map((r) => (r.id === id ? { ...r, [flag]: !r[flag] } : r)));

  const setField = (id: string, field: "source" | "mic" | "preamp" | "notes", value: string) =>
    setInputs((arr) => arr.map((r) => (r.id === id ? { ...r, [field]: value } : r)));

  return (
    <div className="panel overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <div>
          <div className="font-display font-semibold">Input List</div>
          <div className="label-mono mt-0.5">{inputs.length} channels</div>
        </div>
        <button onClick={() => setInputs((arr) => [...arr, helpers.newInput(arr.length + 1)])}
          className="flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-sm bg-surface-2 hover:bg-surface-3 transition">
          <Plus className="h-3.5 w-3.5" /> Channel
        </button>
      </div>

      {/* Desktop / wide: classic table */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left label-mono border-b border-border">
              <th className="px-3 py-2 w-12">CH</th>
              <th className="px-3 py-2">Source</th>
              <th className="px-3 py-2">Mic</th>
              <th className="px-3 py-2">Preamp</th>
              <th className="px-3 py-2 text-center">+48</th>
              <th className="px-3 py-2 text-center">Pad</th>
              <th className="px-3 py-2 text-center">HPF</th>
              <th className="px-3 py-2">Notes</th>
              <th className="px-3 py-2 w-10"></th>
            </tr>
          </thead>
          <tbody>
            {inputs.map((row) => (
              <tr key={row.id} className="channel-row border-b border-border/60 last:border-b-0">
                <td className="px-3 py-1.5 font-mono text-xs text-primary">{String(row.ch).padStart(2, "0")}</td>
                {(["source", "mic", "preamp"] as const).map((field) => (
                  <td key={field} className="px-2 py-1">
                    <input value={row[field]} onChange={(e) => setField(row.id, field, e.target.value)}
                      className="w-full bg-transparent px-2 py-1 rounded-sm hover:bg-surface-2 focus:bg-surface-2 outline-none focus:ring-1 focus:ring-primary text-sm"
                      placeholder="—" />
                  </td>
                ))}
                {(["phantom", "pad", "hpf"] as const).map((flag) => (
                  <td key={flag} className="px-2 py-1 text-center">
                    <button onClick={() => toggle(row.id, flag)}
                      className={cn(
                        "h-5 w-9 rounded-full transition relative",
                        row[flag] ? "bg-primary" : "bg-surface-3"
                      )}>
                      <span className={cn(
                        "absolute top-0.5 h-4 w-4 rounded-full bg-background transition-all",
                        row[flag] ? "left-[18px]" : "left-0.5"
                      )} />
                    </button>
                  </td>
                ))}
                <td className="px-2 py-1">
                  <input value={row.notes} onChange={(e) => setField(row.id, "notes", e.target.value)}
                    className="w-full bg-transparent px-2 py-1 rounded-sm hover:bg-surface-2 focus:bg-surface-2 outline-none focus:ring-1 focus:ring-primary text-sm"
                    placeholder="—" />
                </td>
                <td className="px-2 py-1 text-center">
                  <button onClick={() => setInputs((arr) => arr.filter((r) => r.id !== row.id))}
                    className="text-muted-foreground hover:text-destructive p-1 rounded-sm">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </td>
              </tr>
            ))}
            {inputs.length === 0 && (
              <tr><td colSpan={9} className="px-4 py-8 text-center text-muted-foreground text-sm">No channels yet.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile: card list */}
      <div className="md:hidden divide-y divide-border/60">
        {inputs.map((row) => (
          <div key={row.id} className="p-3 space-y-2.5">
            <div className="flex items-center gap-2">
              <span className="font-mono text-sm font-bold text-primary w-8">
                {String(row.ch).padStart(2, "0")}
              </span>
              <input
                value={row.source}
                onChange={(e) => setField(row.id, "source", e.target.value)}
                placeholder="Source (e.g. Kick In)"
                className="flex-1 min-w-0 bg-input border border-border rounded-sm px-2 py-1.5 text-sm outline-none focus:ring-1 focus:ring-primary"
              />
              <button
                onClick={() => setInputs((arr) => arr.filter((r) => r.id !== row.id))}
                className="text-muted-foreground hover:text-destructive p-1.5"
                aria-label="Delete channel"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2 pl-10">
              <label className="block">
                <div className="label-mono mb-1">Mic</div>
                <input
                  value={row.mic}
                  onChange={(e) => setField(row.id, "mic", e.target.value)}
                  placeholder="—"
                  className="w-full bg-input border border-border rounded-sm px-2 py-1.5 text-sm outline-none focus:ring-1 focus:ring-primary"
                />
              </label>
              <label className="block">
                <div className="label-mono mb-1">Preamp</div>
                <input
                  value={row.preamp}
                  onChange={(e) => setField(row.id, "preamp", e.target.value)}
                  placeholder="—"
                  className="w-full bg-input border border-border rounded-sm px-2 py-1.5 text-sm outline-none focus:ring-1 focus:ring-primary"
                />
              </label>
            </div>

            <div className="flex items-center gap-2 pl-10 flex-wrap">
              {(
                [
                  { key: "phantom", label: "+48V" },
                  { key: "pad", label: "Pad" },
                  { key: "hpf", label: "HPF" },
                ] as const
              ).map((f) => (
                <button
                  key={f.key}
                  onClick={() => toggle(row.id, f.key)}
                  className={cn(
                    "text-[11px] uppercase tracking-wider font-mono px-2.5 py-1 rounded-sm border transition",
                    row[f.key]
                      ? "bg-primary/20 text-primary border-primary/40"
                      : "bg-surface-2 text-muted-foreground border-border",
                  )}
                >
                  {f.label}
                </button>
              ))}
            </div>

            <div className="pl-10">
              <input
                value={row.notes}
                onChange={(e) => setField(row.id, "notes", e.target.value)}
                placeholder="Notes…"
                className="w-full bg-transparent border border-dashed border-border rounded-sm px-2 py-1.5 text-xs outline-none focus:ring-1 focus:ring-primary focus:border-solid"
              />
            </div>
          </div>
        ))}
        {inputs.length === 0 && (
          <div className="px-4 py-8 text-center text-muted-foreground text-sm">No channels yet.</div>
        )}
      </div>
    </div>
  );
}