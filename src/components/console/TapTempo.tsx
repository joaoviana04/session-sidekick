import { useState } from "react";
import { Music2 } from "lucide-react";
import { cn } from "@/lib/utils";

const NOTE_DIVISIONS = [
  { label: "1/4", factor: 1 },
  { label: "1/8", factor: 0.5 },
  { label: "1/8 dotted", factor: 0.75 },
  { label: "1/16", factor: 0.25 },
];

function useTapTempo() {
  const [taps, setTaps] = useState<number[]>([]);
  const [bpm, setBpm] = useState<number | null>(null);

  const tap = () => {
    const now = Date.now();
    let next = [...taps, now].slice(-8);
    if (taps.length > 0 && now - taps[taps.length - 1] > 2000) {
      next = [now];
    }
    setTaps(next);
    if (next.length >= 2) {
      const intervals = next.slice(1).map((t, i) => t - next[i]);
      const avg = intervals.reduce((a, b) => a + b, 0) / intervals.length;
      setBpm(Math.round(60000 / avg));
    }
  };

  const reset = () => { setTaps([]); setBpm(null); };
  return { taps, bpm, tap, reset };
}

/** Compact tap-tempo widget for the session header. */
export function TapTempo() {
  const { taps, bpm, tap, reset } = useTapTempo();

  return (
    <div className="panel p-2.5 flex items-center gap-2.5">
      <Music2 className="h-3.5 w-3.5 text-primary shrink-0 ml-1" />
      <div className="flex flex-col leading-tight">
        <span className="font-display text-lg font-bold tabular-nums">
          {bpm ?? "—"}
          <span className="text-[9px] font-mono opacity-70 ml-1">BPM</span>
        </span>
        <span className="label-mono">{taps.length > 0 ? `${taps.length} taps` : "tap to start"}</span>
      </div>
      <button onClick={tap}
        className="ml-auto px-5 py-2 rounded-sm bg-gradient-amber text-primary-foreground font-display text-sm font-bold active:scale-95 transition uppercase tracking-wider">
        Tap
      </button>
      <button onClick={reset}
        className="text-[10px] text-muted-foreground hover:text-foreground uppercase tracking-wider">reset</button>
    </div>
  );
}

/** Full tap-tempo card with note-division reference, for the Tools page. */
export function TapTempoCard() {
  const { taps, bpm, tap, reset } = useTapTempo();
  const beatMs = bpm ? 60000 / bpm : null;

  return (
    <div className="panel p-4 flex flex-col">
      <div className="flex items-center gap-2 mb-3">
        <Music2 className="h-4 w-4 text-primary" />
        <div className="font-display font-semibold">Tap Tempo</div>
      </div>

      <div className="flex items-center gap-4 mb-4">
        <button
          onClick={tap}
          className="flex-1 rounded-md bg-gradient-amber text-primary-foreground font-display text-sm font-bold uppercase tracking-wider py-4 active:scale-[0.98] transition shadow-led"
        >
          Tap
        </button>
        <div className="text-center min-w-[88px]">
          <div className="font-display text-3xl font-bold tabular-nums leading-none">
            {bpm ?? "—"}
          </div>
          <div className="label-mono mt-1">BPM</div>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-2 text-center mb-3">
        {NOTE_DIVISIONS.map((d) => (
          <div key={d.label} className="rounded-sm bg-surface-2 px-2 py-2">
            <div className="label-mono">{d.label}</div>
            <div className="font-mono text-sm text-primary mt-1 tabular-nums">
              {beatMs ? `${Math.round(beatMs * d.factor)} ms` : "—"}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-auto flex items-center justify-between">
        <div className="label-mono">{taps.length > 0 ? `${taps.length} taps` : "tap to start"}</div>
        <button onClick={reset}
          className={cn(
            "text-[10px] uppercase tracking-wider transition",
            taps.length > 0 ? "text-muted-foreground hover:text-foreground" : "text-muted-foreground/40 pointer-events-none"
          )}>
          Reset
        </button>
      </div>
    </div>
  );
}
