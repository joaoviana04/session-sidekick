import { useState } from "react";

const data: { source: string; cut?: string; boost?: string; tip: string }[] = [
  { source: "Kick", boost: "60-100 Hz (thump), 2-5 kHz (beater)", cut: "200-400 Hz (mud)", tip: "Side-chain bass to kick for punch." },
  { source: "Snare", boost: "150-250 Hz (body), 5 kHz (crack)", cut: "400-600 Hz (boxy)", tip: "Add 10 kHz air with a wide shelf." },
  { source: "Bass", boost: "60-100 Hz (low), 700 Hz-2 kHz (definition)", cut: "200-300 Hz", tip: "HPF at 30-40 Hz to clean rumble." },
  { source: "E. Guitar", boost: "100 Hz (chunk), 2.5-4 kHz (bite)", cut: "500 Hz (honk)", tip: "Pan doubles hard L/R; mono check." },
  { source: "A. Guitar", boost: "80 Hz (body), 8-12 kHz (sparkle)", cut: "200-400 Hz (boom)", tip: "HPF aggressively in a dense mix." },
  { source: "Lead Vocal", boost: "100 Hz (warmth), 3-6 kHz (presence), 12 kHz (air)", cut: "250-500 Hz (mud), 800 Hz (nasal)", tip: "De-ess after compression, before EQ boost." },
  { source: "BV / Harmonies", cut: "300 Hz, 3 kHz", boost: "10 kHz (sheen)", tip: "Pan and double for width." },
  { source: "Cymbals / OH", cut: "300-500 Hz, <100 Hz (HPF)", boost: "10-14 kHz", tip: "Leverage cymbals - don't fight them." },
  { source: "Piano", boost: "80 Hz, 5 kHz", cut: "300 Hz", tip: "Try mid/side EQ for stereo balance." },
  { source: "Synths / Pads", cut: "Low-mids", boost: "Air shelf", tip: "Sidechain to kick for groove." },
];

export function FrequencyGuide() {
  const [q, setQ] = useState("");
  const filtered = data.filter((d) => d.source.toLowerCase().includes(q.toLowerCase()));
  return (
    <div className="panel">
      <div className="px-4 py-3 border-b border-border flex items-center justify-between gap-4">
        <div>
          <div className="font-display font-semibold">Frequency Cheat Sheet</div>
          <div className="label-mono mt-0.5">Starting points - trust your ears</div>
        </div>
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Filter"
          className="bg-input border border-border rounded-sm px-3 py-1.5 text-sm w-40 outline-none focus:ring-1 focus:ring-primary" />
      </div>
      <div className="divide-y divide-border/60 max-h-[500px] overflow-auto">
        {filtered.map((d) => (
          <div key={d.source} className="p-4 hover:bg-surface-2/40">
            <div className="font-display font-semibold text-primary">{d.source}</div>
            <div className="grid md:grid-cols-2 gap-2 mt-2 text-xs">
              {d.boost && <div><span className="label-mono">Boost </span><span className="text-foreground/90 font-mono">{d.boost}</span></div>}
              {d.cut && <div><span className="label-mono">Cut </span><span className="text-foreground/90 font-mono">{d.cut}</span></div>}
            </div>
            <div className="text-xs text-muted-foreground mt-2 italic">{d.tip}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
