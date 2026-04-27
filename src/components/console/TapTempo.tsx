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
    <div className="panel p-4">
      <div className="flex items-center gap-2 mb-3">
        <Music2 className="h-4 w-4 text-primary" />
        <div className="font-display font-semibold">Tap Tempo</div>
      </div>
      <button onClick={tap}
        className="w-full py-6 rounded-md bg-gradient-amber text-primary-foreground font-display text-3xl font-bold active:scale-95 transition">
        {bpm ?? "TAP"}
        <div className="text-xs font-mono opacity-70 mt-1">{bpm ? "BPM" : "tap to start"}</div>
      </button>
      <button onClick={() => { setTaps([]); setBpm(null); }}
        className="w-full mt-2 text-xs text-muted-foreground hover:text-foreground">reset</button>
    </div>
  );
}
