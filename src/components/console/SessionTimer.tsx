import { useEffect, useState } from "react";
import { Play, Pause, RotateCcw, History, Trash2, Wallet } from "lucide-react";
import { useSession } from "@/lib/store/sessions";
import { useProfile, formatCurrency } from "@/lib/store/profile";
import { Link } from "react-router-dom";
import type { Session, TimeLogEntry } from "@/lib/types";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

const uid = () => Math.random().toString(36).slice(2, 10);

function fmt(ms: number) {
  const total = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

function fmtCompact(ms: number) {
  const total = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

function fmtDateTime(iso: string) {
  return new Date(iso).toLocaleString([], {
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

export function SessionTimer({ session }: { session: Session }) {
  const { update } = useSession(session.id);
  const { profile } = useProfile();
  const log = session.timeLog ?? [];
  const open = log.find((e) => e.end === null) ?? null;
  const running = !!open;

  // tick to refresh "now" once per second while running
  const [, setTick] = useState(0);
  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(id);
  }, [running]);

  // Recompute every render so the running entry ticks live (depends on Date.now()).
  const now = Date.now();
  let total = 0;
  let current = 0;
  for (const e of log) {
    const start = new Date(e.start).getTime();
    const end = e.end ? new Date(e.end).getTime() : now;
    const d = Math.max(0, end - start);
    total += d;
    if (!e.end) current = d;
  }
  const totals = { total, current };

  const rate =
    session.hourlyRate != null && session.hourlyRate > 0
      ? session.hourlyRate
      : profile.hourlyRate ?? 0;
  const currency = profile.currency || "EUR";
  const earnings = rate > 0 ? (totals.total / 3_600_000) * rate : 0;
  const earningsCurrent = rate > 0 ? (totals.current / 3_600_000) * rate : 0;

  const setLog = (next: TimeLogEntry[]) =>
    update(session.id, (s) => ({ ...s, timeLog: next }));

  const start = () => {
    if (running) return;
    setLog([...log, { id: uid(), start: new Date().toISOString(), end: null }]);
  };
  const stop = () => {
    if (!open) return;
    setLog(log.map((e) => (e.id === open.id ? { ...e, end: new Date().toISOString() } : e)));
  };
  const reset = () => {
    if (!confirm("Clear all time log entries for this session?")) return;
    setLog([]);
  };
  const remove = (id: string) => {
    if (!confirm("Remove this time log entry?")) return;
    setLog(log.filter((e) => e.id !== id));
  };

  return (
    <div className="panel px-3 py-2 flex items-center gap-3">
      <span className={`led ${running ? "animate-pulse-led" : "led-off"}`} />
      <div className="flex flex-col leading-tight">
        <span className="font-mono text-sm tabular-nums">{fmt(totals.total)}</span>
        {running && (
          <span className="font-mono text-[10px] text-muted-foreground tabular-nums">
            this run · {fmtCompact(totals.current)}
          </span>
        )}
        {rate > 0 && (
          <span className="font-mono text-[10px] text-accent tabular-nums" title={`@ ${formatCurrency(rate, currency, profile.locale)}/h`}>
            {formatCurrency(earnings, currency, profile.locale)}
            {running && earningsCurrent > 0 ? ` · +${formatCurrency(earningsCurrent, currency, profile.locale)}` : ""}
          </span>
        )}
      </div>
      <div className="ml-auto flex gap-1">
        <button
          onClick={running ? stop : start}
          className="p-1.5 rounded-sm bg-surface-2 hover:bg-surface-3 transition"
          title={running ? "Stop" : "Start"}
        >
          {running ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
        </button>
        <Popover>
          <PopoverTrigger
            className="p-1.5 rounded-sm bg-surface-2 hover:bg-surface-3 transition"
            title="Time log"
          >
            <History className="h-3.5 w-3.5" />
          </PopoverTrigger>
          <PopoverContent align="end" className="w-80 p-0">
            <div className="px-3 py-2 border-b border-border flex items-center justify-between">
              <div>
                <div className="font-display font-semibold text-sm">Time log</div>
                <div className="label-mono mt-0.5">
                  {log.length} sessions · total {fmt(totals.total)}
                </div>
                {rate > 0 && (
                  <div className="label-mono mt-0.5 text-accent">
                    earned {formatCurrency(earnings, currency, profile.locale)} @ {formatCurrency(rate, currency, profile.locale)}/h
                  </div>
                )}
              </div>
              <button
                onClick={reset}
                className="text-[10px] uppercase tracking-wider text-muted-foreground hover:text-destructive"
                title="Clear all"
              >
                <RotateCcw className="h-3.5 w-3.5" />
              </button>
            </div>
            <div className="px-3 py-2 border-b border-border/60 flex items-center gap-2">
              <Wallet className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
              <span className="label-mono shrink-0">Rate</span>
              <input
                type="number"
                inputMode="decimal"
                min={0}
                step="0.01"
                value={session.hourlyRate ?? ""}
                onChange={(e) => {
                  const v = e.target.value;
                  update(session.id, { hourlyRate: v === "" ? null : Number(v) });
                }}
                placeholder={profile.hourlyRate != null ? String(profile.hourlyRate) : "from profile"}
                className="flex-1 min-w-0 bg-input border border-border rounded-sm px-2 py-1 text-xs outline-none focus:ring-1 focus:ring-primary font-mono tabular-nums"
              />
              <span className="text-[10px] text-muted-foreground font-mono">{currency}/h</span>
            </div>
            {profile.hourlyRate == null && session.hourlyRate == null && (
              <div className="px-3 py-2 border-b border-border/60 text-[11px] text-muted-foreground">
                Set a default rate on your <Link to="/profile" className="text-accent underline">profile</Link>.
              </div>
            )}
            <div className="max-h-72 overflow-auto divide-y divide-border/60">
              {log.length === 0 && (
                <div className="px-3 py-6 text-center text-xs text-muted-foreground">
                  No time logged yet.
                </div>
              )}
              {[...log].reverse().map((e) => {
                const start = new Date(e.start).getTime();
                const end = e.end ? new Date(e.end).getTime() : Date.now();
                const dur = Math.max(0, end - start);
                return (
                  <div key={e.id} className="px-3 py-2 flex items-center gap-2 text-xs group">
                    <span className={`led ${e.end ? "led-off" : "animate-pulse-led"}`} />
                    <div className="flex-1 min-w-0">
                      <div className="font-mono tabular-nums truncate">
                        {fmtDateTime(e.start)} → {e.end ? fmtDateTime(e.end) : "running"}
                      </div>
                      <div className="font-mono text-[10px] text-muted-foreground tabular-nums">
                        {fmt(dur)}
                      </div>
                    </div>
                    <button
                      onClick={() => remove(e.id)}
                      className="text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition"
                      title="Remove entry"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                );
              })}
            </div>
          </PopoverContent>
        </Popover>
      </div>
    </div>
  );
}
