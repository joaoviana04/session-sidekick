import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, ChevronLeft, ChevronRight, Check, Plus, AlertTriangle, AlertOctagon, Info, Maximize2, Minimize2 } from "lucide-react";
import { useSessions, useSession, helpers } from "@/lib/store/sessions";
import { cn } from "@/lib/utils";
import { TapTempo } from "@/components/console/TapTempo";
import type { ShowLogEntry } from "@/lib/types";

const SEVERITIES: { v: ShowLogEntry["severity"]; label: string; cls: string; Icon: typeof Info }[] = [
  { v: "info", label: "Info", cls: "text-info border-info/40 bg-info/10", Icon: Info },
  { v: "warn", label: "Warn", cls: "text-primary border-primary/40 bg-primary/10", Icon: AlertTriangle },
  { v: "issue", label: "Issue", cls: "text-destructive border-destructive/40 bg-destructive/10", Icon: AlertOctagon },
];

const SessionShowMode = () => {
  const { id } = useParams<{ id: string }>();
  const { sessions } = useSessions();
  const session = sessions.find((s) => s.id === id);
  const { update } = useSession(id ?? "");
  const [active, setActive] = useState(0);
  const [done, setDone] = useState<Record<string, boolean>>({});
  const [logText, setLogText] = useState("");
  const [severity, setSeverity] = useState<ShowLogEntry["severity"]>("info");
  const [now, setNow] = useState(() => new Date());
  const [isFs, setIsFs] = useState(false);

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    const onFs = () => setIsFs(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", onFs);
    return () => document.removeEventListener("fullscreenchange", onFs);
  }, []);

  const songs = useMemo(
    () => (session?.setlist ?? []).slice().sort((a, b) => a.position - b.position),
    [session?.setlist],
  );
  const monitors = session?.monitorMixes ?? [];
  const recentLog = useMemo(
    () => (session?.showLog ?? []).slice().sort((a, b) => b.timestamp.localeCompare(a.timestamp)).slice(0, 6),
    [session?.showLog],
  );

  // Keyboard shortcuts
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (["INPUT", "TEXTAREA"].includes((e.target as HTMLElement)?.tagName)) return;
      if (e.key === "ArrowRight" || e.key === " ") {
        e.preventDefault();
        setActive((i) => Math.min(songs.length - 1, i + 1));
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        setActive((i) => Math.max(0, i - 1));
      } else if (e.key.toLowerCase() === "x") {
        const cur = songs[active];
        if (cur) setDone((d) => ({ ...d, [cur.id]: !d[cur.id] }));
      } else if (e.key.toLowerCase() === "f") {
        toggleFs();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [songs, active]);

  const toggleFs = async () => {
    try {
      if (!document.fullscreenElement) await document.documentElement.requestFullscreen();
      else await document.exitFullscreen();
    } catch { /* ignore */ }
  };

  const addLog = () => {
    if (!logText.trim() || !session) return;
    update(session.id, (s) => ({
      ...s,
      showLog: [
        ...(s.showLog ?? []),
        { id: helpers.uid(), timestamp: new Date().toISOString(), severity, message: logText.trim() },
      ],
    }));
    setLogText("");
  };

  if (!session) {
    return (
      <div className="min-h-screen grid place-items-center text-muted-foreground">
        Session not found. <Link to="/" className="ml-2 text-primary">Back</Link>
      </div>
    );
  }

  const cur = songs[active];
  const next = songs[active + 1];
  const progress = songs.length ? ((active + 1) / songs.length) * 100 : 0;
  const completed = Object.values(done).filter(Boolean).length;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Top bar */}
      <header className="px-4 sm:px-6 py-3 border-b border-border flex items-center gap-3">
        <Link
          to={`/session/${session.id}`}
          className="text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Exit
        </Link>
        <div className="min-w-0 flex-1">
          <div className="font-display font-semibold truncate">{session.title || "Untitled"}</div>
          <div className="label-mono">{session.artist || "—"} · show mode</div>
        </div>
        <div className="hidden sm:block font-mono text-2xl tabular-nums text-primary">
          {now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false })}
        </div>
        <button
          onClick={toggleFs}
          className="p-2 rounded-sm bg-surface-2 hover:bg-surface-3 transition"
          title="Toggle fullscreen (F)"
        >
          {isFs ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
        </button>
      </header>

      {/* Setlist progress bar */}
      {songs.length > 0 && (
        <div className="px-4 sm:px-6 py-2 border-b border-border">
          <div className="flex items-center justify-between mb-1.5">
            <div className="label-mono">Setlist · {completed}/{songs.length} done</div>
            <div className="label-mono">{Math.round(progress)}%</div>
          </div>
          <div className="h-1 w-full bg-surface-2 rounded-sm overflow-hidden">
            <div className="h-full bg-gradient-amber transition-all" style={{ width: `${progress}%` }} />
          </div>
        </div>
      )}

      {/* Main grid */}
      <main className="flex-1 grid lg:grid-cols-3 gap-4 p-4 sm:p-6">
        {/* Now playing — big */}
        <section className="lg:col-span-2 panel p-6 flex flex-col">
          {cur ? (
            <>
              <div className="flex items-start justify-between gap-4 mb-6">
                <div className="min-w-0">
                  <div className="label-mono mb-2">Now · {String(active + 1).padStart(2, "0")} / {String(songs.length).padStart(2, "0")}</div>
                  <h1 className="font-display font-bold text-4xl sm:text-6xl leading-[0.95] truncate">
                    {cur.title || "—"}
                  </h1>
                  <div className="mt-3 flex items-center flex-wrap gap-3 font-mono text-base text-muted-foreground">
                    {cur.bpm && <span><span className="text-primary">{cur.bpm}</span> bpm</span>}
                    {cur.key && <span><span className="text-primary">{cur.key}</span> key</span>}
                    {cur.duration && <span><span className="text-primary">{cur.duration}</span></span>}
                  </div>
                </div>
                <button
                  onClick={() => setDone((d) => ({ ...d, [cur.id]: !d[cur.id] }))}
                  className={cn(
                    "shrink-0 h-14 w-14 rounded-sm border-2 grid place-items-center transition",
                    done[cur.id]
                      ? "bg-success/20 border-success text-success"
                      : "border-border hover:border-primary text-muted-foreground hover:text-primary",
                  )}
                  title="Mark song done (X)"
                >
                  <Check className="h-7 w-7" />
                </button>
              </div>

              {cur.cues && (
                <div className="mb-4">
                  <div className="label-mono mb-1.5">Cues</div>
                  <div className="text-lg sm:text-xl text-foreground bg-surface-2 rounded-sm px-4 py-3 leading-snug">
                    {cur.cues}
                  </div>
                </div>
              )}
              {cur.notes && (
                <div className="mb-6">
                  <div className="label-mono mb-1.5">Notes</div>
                  <div className="text-base text-muted-foreground bg-surface-2 rounded-sm px-4 py-3 whitespace-pre-wrap">
                    {cur.notes}
                  </div>
                </div>
              )}

              <div className="mt-auto flex items-center justify-between gap-3">
                <button
                  onClick={() => setActive((i) => Math.max(0, i - 1))}
                  disabled={active === 0}
                  className="flex items-center gap-2 rounded-sm bg-surface-2 hover:bg-surface-3 px-4 py-3 text-sm transition disabled:opacity-30"
                >
                  <ChevronLeft className="h-5 w-5" /> Prev
                </button>
                <div className="text-center min-w-0 flex-1">
                  {next ? (
                    <>
                      <div className="label-mono mb-0.5">Up next</div>
                      <div className="truncate font-medium">{next.title || "—"}</div>
                    </>
                  ) : (
                    <div className="label-mono">Last song</div>
                  )}
                </div>
                <button
                  onClick={() => setActive((i) => Math.min(songs.length - 1, i + 1))}
                  disabled={active >= songs.length - 1}
                  className="flex items-center gap-2 rounded-sm bg-gradient-amber text-primary-foreground px-4 py-3 text-sm font-semibold hover:opacity-90 transition disabled:opacity-30"
                >
                  Next <ChevronRight className="h-5 w-5" />
                </button>
              </div>
            </>
          ) : (
            <div className="flex-1 grid place-items-center text-center text-muted-foreground">
              <div>
                <div className="label-mono mb-2">No setlist</div>
                <Link to={`/session/${session.id}`} className="text-primary text-sm">Add songs in the session →</Link>
              </div>
            </div>
          )}
        </section>

        {/* Side: setlist + monitors + log */}
        <aside className="space-y-4 flex flex-col min-h-0">
          <div className="panel overflow-hidden flex flex-col max-h-[40vh] lg:max-h-none lg:flex-1">
            <div className="px-4 py-3 border-b border-border font-display font-semibold">Setlist</div>
            <div className="overflow-auto divide-y divide-border/60">
              {songs.map((s, i) => (
                <button
                  key={s.id}
                  onClick={() => setActive(i)}
                  className={cn(
                    "w-full text-left px-4 py-2.5 flex items-center gap-3 hover:bg-surface-2 transition",
                    i === active && "bg-primary/10",
                  )}
                >
                  <span className={cn("font-mono text-xs w-7 tabular-nums", i === active ? "text-primary" : "text-muted-foreground")}>
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span className={cn("flex-1 truncate text-sm", done[s.id] && "line-through text-muted-foreground")}>
                    {s.title || "—"}
                  </span>
                  {s.bpm && <span className="font-mono text-[10px] text-muted-foreground">{s.bpm}</span>}
                  {done[s.id] && <Check className="h-3.5 w-3.5 text-success" />}
                </button>
              ))}
              {songs.length === 0 && (
                <div className="px-4 py-6 text-center text-muted-foreground text-sm">No songs.</div>
              )}
            </div>
          </div>

          {monitors.length > 0 && (
            <div className="panel overflow-hidden">
              <div className="px-4 py-2.5 border-b border-border font-display font-semibold text-sm">Monitors</div>
              <div className="divide-y divide-border/60 max-h-[28vh] overflow-auto">
                {monitors.map((m) => (
                  <div key={m.id} className="px-4 py-2 flex items-center gap-2 text-sm">
                    <span className="font-mono text-xs text-primary w-10 shrink-0">{m.mixNumber}</span>
                    <span className="font-medium truncate">{m.performer || "—"}</span>
                    <span className="ml-auto label-mono shrink-0">{m.type}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="panel overflow-hidden">
            <div className="px-4 py-2.5 border-b border-border flex items-center justify-between">
              <div className="font-display font-semibold text-sm">Quick log</div>
              <div className="flex items-center gap-1">
                {SEVERITIES.map((s) => (
                  <button
                    key={s.v}
                    onClick={() => setSeverity(s.v)}
                    className={cn(
                      "p-1 rounded-sm border transition",
                      severity === s.v ? s.cls : "bg-surface-2 text-muted-foreground border-border",
                    )}
                    title={s.label}
                  >
                    <s.Icon className="h-3 w-3" />
                  </button>
                ))}
              </div>
            </div>
            <div className="p-3 space-y-2">
              <div className="flex gap-2">
                <input
                  value={logText}
                  onChange={(e) => setLogText(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") addLog(); }}
                  placeholder="What happened?"
                  className="flex-1 min-w-0 bg-input border border-border rounded-sm px-2.5 py-2 text-sm outline-none focus:ring-1 focus:ring-primary"
                />
                <button
                  onClick={addLog}
                  disabled={!logText.trim()}
                  className="rounded-sm bg-gradient-amber text-primary-foreground px-3 py-2 text-sm font-semibold disabled:opacity-40"
                  aria-label="Add log entry"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
              {recentLog.length > 0 && (
                <div className="space-y-1 max-h-32 overflow-auto">
                  {recentLog.map((e) => {
                    const meta = SEVERITIES.find((s) => s.v === e.severity)!;
                    return (
                      <div key={e.id} className="flex items-start gap-2 text-xs">
                        <meta.Icon className={cn("h-3 w-3 shrink-0 mt-0.5", meta.cls.split(" ")[0])} />
                        <span className="flex-1 truncate">{e.message}</span>
                        <span className="font-mono text-[10px] text-muted-foreground shrink-0">
                          {new Date(e.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: false })}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          <div className="panel p-3">
            <TapTempo />
          </div>
        </aside>
      </main>

      <footer className="px-4 sm:px-6 py-2 border-t border-border text-[10px] font-mono text-muted-foreground flex items-center justify-between">
        <div>← / → navigate · X mark done · F fullscreen</div>
        <div>{session.venue || ""}</div>
      </footer>
    </div>
  );
};

export default SessionShowMode;