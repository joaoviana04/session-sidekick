import { Plus, Trash2, Table2, Workflow, Cable } from "lucide-react";
import { useState } from "react";
import { useSession, helpers } from "@/lib/store/sessions";
import type { Session } from "@/lib/types";
import { cn } from "@/lib/utils";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { SignalFlow } from "./SignalFlow";

export function InputList({ session }: { session: Session }) {
  const { update } = useSession(session.id);
  const inputs = session.inputs ?? [];
  const isLive = session.type === "live";
  const [customCount, setCustomCount] = useState("");
  const [popOpen, setPopOpen] = useState(false);
  const [view, setView] = useState<"table" | "flow">(() => {
    const saved = typeof window !== "undefined" ? localStorage.getItem("inputListView") : null;
    return saved === "flow" ? "flow" : "table";
  });
  const setViewPersist = (v: "table" | "flow") => {
    setView(v);
    try { localStorage.setItem("inputListView", v); } catch { /* ignore */ }
  };

  const setInputs = (fn: (i: typeof inputs) => typeof inputs) =>
    update(session.id, (s) => ({ ...s, inputs: fn(s.inputs ?? []) }));

  const addMany = (n: number) => {
    if (!Number.isFinite(n) || n < 1) return;
    const count = Math.min(Math.floor(n), 128);
    setInputs((arr) => {
      const start = arr.length;
      const added = Array.from({ length: count }, (_, i) => helpers.newInput(start + i + 1));
      return [...arr, ...added];
    });
    setCustomCount("");
    setPopOpen(false);
  };

  const toggle = (id: string, flag: "phantom" | "pad" | "hpf") =>
    setInputs((arr) => arr.map((r) => (r.id === id ? { ...r, [flag]: !r[flag] } : r)));

  const setField = (id: string, field: "source" | "mic" | "preamp" | "notes" | "stand" | "stageBox", value: string) =>
    setInputs((arr) => arr.map((r) => (r.id === id ? { ...r, [field]: value } : r)));

  return (
    <div className="panel overflow-hidden">
      <div className="panel-header">
        <div className="panel-icon">
          <Cable className="h-4 w-4" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="panel-title">{isLive ? "Patch List" : "Input List"}</div>
          <div className="panel-subtitle">{inputs.length} channels</div>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center rounded-lg bg-surface-2 border border-border overflow-hidden">
            <button
              onClick={() => setViewPersist("table")}
              className={cn(
                "flex items-center gap-1 text-xs px-2 py-1.5 transition",
                view === "table" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground",
              )}
              title="Table view"
            >
              <Table2 className="h-3.5 w-3.5" /> <span className="hidden sm:inline">Table</span>
            </button>
            <button
              onClick={() => setViewPersist("flow")}
              className={cn(
                "flex items-center gap-1 text-xs px-2 py-1.5 transition",
                view === "flow" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground",
              )}
              title="Signal flow view"
            >
              <Workflow className="h-3.5 w-3.5" /> <span className="hidden sm:inline">Flow</span>
            </button>
          </div>
        <Popover open={popOpen} onOpenChange={setPopOpen}>
          <PopoverTrigger className="flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg bg-surface-2 hover:bg-surface-3 transition">
            <Plus className="h-3.5 w-3.5" /> Add channels
          </PopoverTrigger>
          <PopoverContent align="end" className="w-56 p-3 space-y-2">
            <div className="label-mono">Add how many?</div>
            <div className="grid grid-cols-4 gap-1.5">
              {[1, 4, 8, 16, 24, 32, 48, 64].map((n) => (
                <button
                  key={n}
                  onClick={() => addMany(n)}
                  className="text-xs py-1.5 rounded-sm bg-surface-2 hover:bg-primary hover:text-primary-foreground transition font-mono"
                >
                  {n}
                </button>
              ))}
            </div>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const n = parseInt(customCount, 10);
                if (n > 0) addMany(n);
              }}
              className="flex items-center gap-1.5 pt-1"
            >
              <input
                type="number"
                min={1}
                max={128}
                value={customCount}
                onChange={(e) => setCustomCount(e.target.value)}
                placeholder="Custom"
                className="flex-1 min-w-0 bg-input border border-border rounded-sm px-2 py-1.5 text-xs outline-none focus:ring-1 focus:ring-primary"
              />
              <button
                type="submit"
                className="text-xs px-2.5 py-1.5 rounded-sm bg-primary text-primary-foreground hover:opacity-90"
              >
                Add
              </button>
            </form>
          </PopoverContent>
        </Popover>
        </div>
      </div>

      {view === "flow" ? (
        <SignalFlow session={session} />
      ) : (
        <>
      {/* Desktop / wide: classic table */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left label-mono border-b border-border">
              <th className="px-3 py-2 w-12">CH</th>
              <th className="px-3 py-2">Source</th>
              <th className="px-3 py-2">Mic</th>
              <th className="px-3 py-2">Preamp</th>
              {isLive && <th className="px-3 py-2">Stage box</th>}
              {isLive && <th className="px-3 py-2">Stand</th>}
              <th className="px-3 py-2 text-center w-[120px]">Options</th>
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
                {isLive && (
                  <td className="px-2 py-1">
                    <input value={row.stageBox ?? ""} onChange={(e) => setField(row.id, "stageBox", e.target.value)}
                      className="w-full bg-transparent px-2 py-1 rounded-sm hover:bg-surface-2 focus:bg-surface-2 outline-none focus:ring-1 focus:ring-primary text-sm"
                      placeholder="SB1/01" />
                  </td>
                )}
                {isLive && (
                  <td className="px-2 py-1">
                    <input value={row.stand ?? ""} onChange={(e) => setField(row.id, "stand", e.target.value)}
                      className="w-full bg-transparent px-2 py-1 rounded-sm hover:bg-surface-2 focus:bg-surface-2 outline-none focus:ring-1 focus:ring-primary text-sm"
                      placeholder="Boom S" />
                  </td>
                )}
                <td className="px-2 py-1">
                  <div className="flex items-center justify-center gap-1">
                    {(
                      [
                        { key: "phantom", label: "48V" },
                        { key: "pad", label: "PAD" },
                        { key: "hpf", label: "HPF" },
                      ] as const
                    ).map((f) => (
                      <button
                        key={f.key}
                        onClick={() => toggle(row.id, f.key)}
                        className={cn(
                          "text-[10px] font-mono uppercase tracking-wider px-1.5 py-0.5 rounded-sm border transition",
                          row[f.key]
                            ? "bg-primary/20 text-primary border-primary/40"
                            : "bg-surface-2 text-muted-foreground border-border hover:text-foreground"
                        )}
                      >
                        {f.label}
                      </button>
                    ))}
                  </div>
                </td>
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
              <tr><td colSpan={isLive ? 9 : 7} className="px-4 py-8 text-center text-muted-foreground text-sm">No channels yet.</td></tr>
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
              {isLive && (
                <label className="block">
                  <div className="label-mono mb-1">Stage box</div>
                  <input
                    value={row.stageBox ?? ""}
                    onChange={(e) => setField(row.id, "stageBox", e.target.value)}
                    placeholder="SB1/01"
                    className="w-full bg-input border border-border rounded-sm px-2 py-1.5 text-sm outline-none focus:ring-1 focus:ring-primary"
                  />
                </label>
              )}
              {isLive && (
                <label className="block">
                  <div className="label-mono mb-1">Stand</div>
                  <input
                    value={row.stand ?? ""}
                    onChange={(e) => setField(row.id, "stand", e.target.value)}
                    placeholder="Boom"
                    className="w-full bg-input border border-border rounded-sm px-2 py-1.5 text-sm outline-none focus:ring-1 focus:ring-primary"
                  />
                </label>
              )}
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
        </>
      )}
    </div>
  );
}