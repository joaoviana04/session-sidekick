import { useState } from "react";
import { Plus, Trash2, AlertTriangle, Info, AlertOctagon } from "lucide-react";
import { useSession, helpers } from "@/lib/store/sessions";
import type { Session, ShowLogEntry } from "@/lib/types";
import { cn } from "@/lib/utils";

const SEVERITIES: { v: ShowLogEntry["severity"]; label: string; className: string; Icon: typeof Info }[] = [
  { v: "info", label: "Info", className: "text-info border-info/40 bg-info/10", Icon: Info },
  { v: "warn", label: "Warn", className: "text-primary border-primary/40 bg-primary/10", Icon: AlertTriangle },
  { v: "issue", label: "Issue", className: "text-destructive border-destructive/40 bg-destructive/10", Icon: AlertOctagon },
];

export function ShowLog({ session }: { session: Session }) {
  const { update } = useSession(session.id);
  const log = (session.showLog ?? []).slice().sort((a, b) => b.timestamp.localeCompare(a.timestamp));
  const [text, setText] = useState("");
  const [severity, setSeverity] = useState<ShowLogEntry["severity"]>("info");

  const setLog = (fn: (l: ShowLogEntry[]) => ShowLogEntry[]) =>
    update(session.id, (s) => ({ ...s, showLog: fn(s.showLog ?? []) }));

  const add = () => {
    if (!text.trim()) return;
    setLog((arr) => [
      ...arr,
      { id: helpers.uid(), timestamp: new Date().toISOString(), severity, message: text.trim() },
    ]);
    setText("");
  };

  return (
    <div className="panel">
      <div className="px-4 py-3 border-b border-border">
        <div className="font-display font-semibold">Show Log</div>
        <div className="label-mono mt-0.5">{log.length} entries · timestamped</div>
      </div>

      <div className="p-3 space-y-2 border-b border-border">
        <div className="flex items-center gap-1.5 flex-wrap">
          {SEVERITIES.map((s) => (
            <button
              key={s.v}
              onClick={() => setSeverity(s.v)}
              className={cn(
                "text-[11px] uppercase tracking-wider font-mono px-2.5 py-1 rounded-sm border transition flex items-center gap-1",
                severity === s.v ? s.className : "bg-surface-2 text-muted-foreground border-border",
              )}
            >
              <s.Icon className="h-3 w-3" />
              {s.label}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") add(); }}
            placeholder="What happened? (e.g. RF dropout vox 2, ch 14)"
            className="flex-1 min-w-0 bg-input border border-border rounded-sm px-2.5 py-2 text-sm outline-none focus:ring-1 focus:ring-primary"
          />
          <button
            onClick={add}
            disabled={!text.trim()}
            className="rounded-sm bg-gradient-amber text-primary-foreground px-3 py-2 text-sm font-semibold disabled:opacity-40 transition"
            aria-label="Add log entry"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="divide-y divide-border/60 max-h-[420px] overflow-auto">
        {log.map((e) => {
          const meta = SEVERITIES.find((s) => s.v === e.severity)!;
          return (
            <div key={e.id} className="p-3 flex items-start gap-2.5">
              <meta.Icon className={cn("h-4 w-4 shrink-0 mt-0.5", meta.className.split(" ")[0])} />
              <div className="min-w-0 flex-1">
                <div className="text-sm break-words">{e.message}</div>
                <div className="font-mono text-[10px] text-muted-foreground mt-0.5">
                  {new Date(e.timestamp).toLocaleString([], {
                    month: "short", day: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false,
                  })}
                </div>
              </div>
              <button
                onClick={() => setLog((arr) => arr.filter((x) => x.id !== e.id))}
                className="text-muted-foreground hover:text-destructive p-1 shrink-0"
                aria-label="Delete entry"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          );
        })}
        {log.length === 0 && (
          <div className="px-4 py-8 text-center text-muted-foreground text-sm">Show log is empty.</div>
        )}
      </div>
    </div>
  );
}
