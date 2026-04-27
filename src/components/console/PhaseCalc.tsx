import { useState } from "react";
import { Waves } from "lucide-react";

export function PhaseCalc() {
  const [sr, setSr] = useState(48000);
  const [ms, setMs] = useState(10);
  const samples = Math.round((ms / 1000) * sr);
  const hz = ms > 0 ? (1000 / ms).toFixed(2) : "-";
  const distM = ((ms / 1000) * 343).toFixed(2);

  return (
    <div className="panel p-4">
      <div className="flex items-center gap-2 mb-3">
        <Waves className="h-4 w-4 text-primary" />
        <div className="font-display font-semibold">Delay / Phase</div>
      </div>
      <div className="grid grid-cols-2 gap-3 mb-3">
        <label className="block">
          <div className="label-mono mb-1">Sample rate</div>
          <select value={sr} onChange={(e) => setSr(Number(e.target.value))}
            className="w-full bg-input border border-border rounded-sm px-2 py-1.5 text-sm font-mono">
            {[44100, 48000, 88200, 96000, 192000].map((r) => <option key={r} value={r}>{r}</option>)}
          </select>
        </label>
        <label className="block">
          <div className="label-mono mb-1">Time (ms)</div>
          <input type="number" step="0.1" value={ms} onChange={(e) => setMs(Number(e.target.value))}
            className="w-full bg-input border border-border rounded-sm px-2 py-1.5 text-sm font-mono" />
        </label>
      </div>
      <div className="grid grid-cols-3 gap-2 text-center">
        <Stat label="Samples" value={samples.toLocaleString()} />
        <Stat label="Frequency" value={`${hz} Hz`} />
        <Stat label="Distance" value={`${distM} m`} />
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-sm bg-surface-2 px-2 py-2">
      <div className="label-mono">{label}</div>
      <div className="font-mono text-sm text-primary mt-1 tabular-nums">{value}</div>
    </div>
  );
}
