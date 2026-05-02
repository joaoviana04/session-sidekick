import { Plus, Trash2, Headphones, Speaker } from "lucide-react";
import { useSession, helpers } from "@/lib/store/sessions";
import type { Session, MonitorMix } from "@/lib/types";
import { cn } from "@/lib/utils";

const TYPES: { v: MonitorMix["type"]; label: string }[] = [
  { v: "iem", label: "IEM" },
  { v: "wedge", label: "Wedge" },
  { v: "sidefill", label: "Sidefill" },
];

export function MonitorMixes({ session }: { session: Session }) {
  const { update } = useSession(session.id);
  const mixes = session.monitorMixes ?? [];

  const setMixes = (fn: (m: MonitorMix[]) => MonitorMix[]) =>
    update(session.id, (s) => ({ ...s, monitorMixes: fn(s.monitorMixes ?? []) }));

  const setField = <K extends keyof MonitorMix>(id: string, field: K, value: MonitorMix[K]) =>
    setMixes((arr) => arr.map((m) => (m.id === id ? { ...m, [field]: value } : m)));

  const add = () =>
    setMixes((arr) => [
      ...arr,
      {
        id: helpers.uid(),
        mixNumber: String(arr.length + 1),
        performer: "",
        type: "iem",
        contents: "",
        notes: "",
      },
    ]);

  return (
    <div className="panel">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <div>
          <div className="font-display font-semibold">Monitor Mixes</div>
          <div className="label-mono mt-0.5">{mixes.length} mixes</div>
        </div>
        <button onClick={add}
          className="flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-sm bg-surface-2 hover:bg-surface-3 transition">
          <Plus className="h-3.5 w-3.5" /> Mix
        </button>
      </div>

      <div className="divide-y divide-border/60">
        {mixes.map((m) => {
          const Icon = m.type === "iem" ? Headphones : Speaker;
          return (
            <div key={m.id} className="p-3 space-y-2">
              <div className="flex items-center gap-2">
                <input
                  value={m.mixNumber}
                  onChange={(e) => setField(m.id, "mixNumber", e.target.value)}
                  className="w-14 bg-input border border-border rounded-sm px-2 py-1.5 text-sm font-mono text-primary outline-none focus:ring-1 focus:ring-primary"
                  placeholder="#"
                />
                <input
                  value={m.performer}
                  onChange={(e) => setField(m.id, "performer", e.target.value)}
                  placeholder="Performer (e.g. Lead vox)"
                  className="flex-1 min-w-0 bg-input border border-border rounded-sm px-2 py-1.5 text-sm outline-none focus:ring-1 focus:ring-primary"
                />
                <Icon className="h-4 w-4 text-muted-foreground hidden sm:block" />
                <button
                  onClick={() => setMixes((arr) => arr.filter((x) => x.id !== m.id))}
                  className="text-muted-foreground hover:text-destructive p-1.5"
                  aria-label="Delete mix"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>

              <div className="flex items-center gap-1.5 flex-wrap">
                {TYPES.map((t) => (
                  <button
                    key={t.v}
                    onClick={() => setField(m.id, "type", t.v)}
                    className={cn(
                      "text-[11px] uppercase tracking-wider font-mono px-2.5 py-1 rounded-sm border transition",
                      m.type === t.v
                        ? "bg-primary/20 text-primary border-primary/40"
                        : "bg-surface-2 text-muted-foreground border-border",
                    )}
                  >
                    {t.label}
                  </button>
                ))}
              </div>

              <input
                value={m.contents}
                onChange={(e) => setField(m.id, "contents", e.target.value)}
                placeholder="Contents (e.g. Vox loud, click, kick, less bass)"
                className="w-full bg-transparent border border-dashed border-border rounded-sm px-2 py-1.5 text-xs outline-none focus:ring-1 focus:ring-primary focus:border-solid"
              />
              <input
                value={m.notes}
                onChange={(e) => setField(m.id, "notes", e.target.value)}
                placeholder="Notes…"
                className="w-full bg-transparent border border-dashed border-border rounded-sm px-2 py-1.5 text-xs outline-none focus:ring-1 focus:ring-primary focus:border-solid"
              />
            </div>
          );
        })}
        {mixes.length === 0 && (
          <div className="px-4 py-8 text-center text-muted-foreground text-sm">No monitor mixes yet.</div>
        )}
      </div>
    </div>
  );
}
