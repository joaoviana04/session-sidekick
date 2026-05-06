import { useState } from "react";
import { Music2 } from "lucide-react";

export function TapTempo() {
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

  return (
    <div className="panel p-2.5 flex items-center gap-2.5">
      <Music2 className="h-3.5 w-3.5 text-primary shrink-0 ml-1" />
      <div className="text-xs label-mono">Tap</div>
      <button onClick={tap}
        className="ml-auto px-4 py-2 rounded-sm bg-gradient-amber text-primary-foreground font-display text-base font-bold active:scale-95 transition tabular-nums min-w-[88px]">
        {bpm ?? "TAP"}
        <span className="text-[9px] font-mono opacity-70 ml-1">{bpm ? "BPM" : ""}</span>
      </button>
      <button onClick={() => { setTaps([]); setBpm(null); }}
        className="text-[10px] text-muted-foreground hover:text-foreground uppercase tracking-wider">reset</button>
    </div>
  );
}
