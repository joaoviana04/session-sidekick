import { useEffect, useRef, useState } from "react";
import { Play, Pause, RotateCcw } from "lucide-react";

function fmt(ms: number) {
  const total = Math.floor(ms / 1000);
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export function SessionTimer() {
  const [running, setRunning] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const startRef = useRef<number | null>(null);

  useEffect(() => {
    if (!running) return;
    startRef.current = Date.now() - elapsed;
    const id = setInterval(() => {
      if (startRef.current) setElapsed(Date.now() - startRef.current);
    }, 250);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running]);

  return (
    <div className="panel px-3 py-2 flex items-center gap-3">
      <span className={`led ${running ? "animate-pulse-led" : "led-off"}`} />
      <span className="font-mono text-sm tabular-nums">{fmt(elapsed)}</span>
      <div className="ml-auto flex gap-1">
        <button onClick={() => setRunning((r) => !r)}
          className="p-1.5 rounded-sm bg-surface-2 hover:bg-surface-3 transition" title={running ? "Pause" : "Start"}>
          {running ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
        </button>
        <button onClick={() => { setRunning(false); setElapsed(0); }}
          className="p-1.5 rounded-sm bg-surface-2 hover:bg-surface-3 transition" title="Reset">
          <RotateCcw className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}