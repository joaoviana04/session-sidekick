import { useMemo, useState } from "react";
import type { Session, InputChannel } from "@/lib/types";
import { cn } from "@/lib/utils";

type FlowStyle = "cards" | "patchbay" | "groups";

function Badges({ row }: { row: InputChannel }) {
  const flags = [
    { on: row.phantom, label: "48V" },
    { on: row.pad, label: "PAD" },
    { on: row.hpf, label: "HPF" },
  ].filter((f) => f.on);
  if (flags.length === 0) return null;
  return (
    <div className="flex gap-1 mt-1.5 flex-wrap">
      {flags.map((f) => (
        <span key={f.label} className="text-[9px] font-mono uppercase tracking-wider px-1.5 py-0.5 rounded-sm bg-primary/20 text-primary border border-primary/40">
          {f.label}
        </span>
      ))}
    </div>
  );
}

function Node({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div
      className={cn(
        "min-w-0 flex-1 rounded-sm border px-2.5 py-1.5 bg-surface-2",
        accent ? "border-primary/40" : "border-border",
      )}
    >
      <div className="label-mono truncate">{label}</div>
      <div className={cn("text-sm truncate", value ? "text-foreground" : "text-muted-foreground")}>
        {value || "—"}
      </div>
    </div>
  );
}

function Arrow() {
  return (
    <div className="shrink-0 flex items-center text-primary/60 px-0.5" aria-hidden>
      <svg width="18" height="10" viewBox="0 0 18 10" fill="none">
        <path d="M0 5 H14 M10 1 L14 5 L10 9" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
  );
}

function CardsView({ inputs, isLive }: { inputs: InputChannel[]; isLive: boolean }) {
  return (
    <div className="space-y-2">
      {inputs.map((row) => (
        <div key={row.id} className="rounded-sm border border-border bg-surface px-3 py-2.5">
          <div className="flex items-center gap-2 mb-2">
            <span className="font-mono text-xs font-bold text-primary">CH {String(row.ch).padStart(2, "0")}</span>
            {row.notes && <span className="text-xs text-muted-foreground truncate">· {row.notes}</span>}
          </div>
          <div className="flex items-stretch gap-1.5 overflow-x-auto">
            <Node label="Source" value={row.source} accent />
            <Arrow />
            <Node label="Mic / DI" value={row.mic} />
            <Arrow />
            {isLive && (
              <>
                <Node label="Stage box" value={row.stageBox ?? ""} />
                <Arrow />
              </>
            )}
            <Node label="Preamp" value={row.preamp} />
            <Arrow />
            <div className="min-w-0 flex-1 rounded-sm border border-primary/40 px-2.5 py-1.5 bg-primary/10">
              <div className="label-mono">Channel</div>
              <div className="text-sm font-mono text-primary">CH {String(row.ch).padStart(2, "0")}</div>
              <Badges row={row} />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function PatchbayView({ inputs, isLive }: { inputs: InputChannel[]; isLive: boolean }) {
  const cols = isLive
    ? (["source", "mic", "stageBox", "preamp"] as const)
    : (["source", "mic", "preamp"] as const);
  const labels: Record<string, string> = {
    source: "Sources",
    mic: "Mics / DIs",
    stageBox: "Stage box",
    preamp: "Preamps",
  };
  return (
    <div className="overflow-x-auto">
      <div className="grid gap-3 min-w-[640px]" style={{ gridTemplateColumns: `repeat(${cols.length + 1}, minmax(0,1fr))` }}>
        {cols.map((c) => (
          <div key={c} className="label-mono text-center">{labels[c]}</div>
        ))}
        <div className="label-mono text-center">Channel</div>
        {inputs.map((row) => (
          <div key={row.id} className="contents">
            {cols.map((c) => (
              <div key={c} className="rounded-sm border border-border bg-surface-2 px-2 py-1.5 text-sm truncate flex items-center">
                <span className={cn(row[c as keyof InputChannel] ? "text-foreground" : "text-muted-foreground")}>
                  {(row[c as keyof InputChannel] as string) || "—"}
                </span>
              </div>
            ))}
            <div className="rounded-sm border border-primary/40 bg-primary/10 px-2 py-1.5 flex items-center justify-between gap-2">
              <span className="font-mono text-sm text-primary">CH {String(row.ch).padStart(2, "0")}</span>
              <div className="flex gap-1">
                {[
                  { on: row.phantom, label: "48V" },
                  { on: row.pad, label: "PAD" },
                  { on: row.hpf, label: "HPF" },
                ].filter((f) => f.on).map((f) => (
                  <span key={f.label} className="text-[9px] font-mono px-1 py-0.5 rounded-sm bg-primary/20 text-primary border border-primary/40">{f.label}</span>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

const GROUP_RULES: { name: string; match: RegExp }[] = [
  { name: "Drums", match: /kick|snare|tom|hat|hh|ride|crash|cymbal|oh|overhead|drum|perc/i },
  { name: "Bass", match: /bass|sub|808/i },
  { name: "Guitars", match: /guit|gtr|amp|cab|acoustic/i },
  { name: "Keys / Synth", match: /key|piano|synth|organ|rhodes|wurli|pad/i },
  { name: "Vocals", match: /vox|vocal|voc|sing|lead|choir|bv/i },
  { name: "Strings / Brass / Wind", match: /violin|viola|cello|string|sax|trumpet|trombone|brass|flute|wind/i },
  { name: "FX / Returns", match: /fx|reverb|delay|return|talkback|tb/i },
];

function classify(row: InputChannel): string {
  const hay = `${row.source} ${row.mic}`.trim();
  for (const g of GROUP_RULES) if (g.match.test(hay)) return g.name;
  return "Other";
}

function GroupsView({ inputs, isLive }: { inputs: InputChannel[]; isLive: boolean }) {
  const grouped = useMemo(() => {
    const m = new Map<string, InputChannel[]>();
    for (const r of inputs) {
      const g = classify(r);
      if (!m.has(g)) m.set(g, []);
      m.get(g)!.push(r);
    }
    return Array.from(m.entries());
  }, [inputs]);
  return (
    <div className="space-y-3">
      {grouped.map(([group, rows]) => (
        <div key={group} className="rounded-sm border border-border bg-surface">
          <div className="px-3 py-2 border-b border-border flex items-center justify-between">
            <div className="font-display font-semibold text-sm">{group}</div>
            <div className="label-mono">{rows.length} ch</div>
          </div>
          <div className="p-2 space-y-1.5">
            {rows.map((row) => (
              <div key={row.id} className="flex items-stretch gap-1.5 overflow-x-auto">
                <div className="shrink-0 w-12 flex items-center justify-center font-mono text-xs text-primary">
                  {String(row.ch).padStart(2, "0")}
                </div>
                <Node label="Source" value={row.source} accent />
                <Arrow />
                <Node label="Mic" value={row.mic} />
                <Arrow />
                {isLive && (
                  <>
                    <Node label="SB" value={row.stageBox ?? ""} />
                    <Arrow />
                  </>
                )}
                <Node label="Preamp" value={row.preamp} />
                <div className="shrink-0 flex items-center gap-1 px-1">
                  {[
                    { on: row.phantom, label: "48V" },
                    { on: row.pad, label: "PAD" },
                    { on: row.hpf, label: "HPF" },
                  ].filter((f) => f.on).map((f) => (
                    <span key={f.label} className="text-[9px] font-mono px-1 py-0.5 rounded-sm bg-primary/20 text-primary border border-primary/40">{f.label}</span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export function SignalFlow({ session }: { session: Session }) {
  const [style, setStyle] = useState<FlowStyle>(() => {
    const saved = typeof window !== "undefined" ? localStorage.getItem("flowStyle") : null;
    return (saved as FlowStyle) || "cards";
  });
  const inputs = session.inputs ?? [];
  const isLive = session.type === "live";

  const setAndPersist = (s: FlowStyle) => {
    setStyle(s);
    try { localStorage.setItem("flowStyle", s); } catch { /* ignore */ }
  };

  if (inputs.length === 0) {
    return <div className="px-4 py-8 text-center text-muted-foreground text-sm">No channels yet.</div>;
  }

  return (
    <div className="p-3 space-y-3">
      <div className="flex items-center gap-1 flex-wrap">
        <span className="label-mono mr-1">Layout:</span>
        {([
          { k: "cards", label: "Cards + arrows" },
          { k: "patchbay", label: "Patchbay grid" },
          { k: "groups", label: "By instrument" },
        ] as const).map((opt) => (
          <button
            key={opt.k}
            onClick={() => setAndPersist(opt.k)}
            className={cn(
              "text-xs px-2.5 py-1 rounded-sm border transition font-mono",
              style === opt.k
                ? "bg-primary/20 text-primary border-primary/40"
                : "bg-surface-2 text-muted-foreground border-border hover:text-foreground",
            )}
          >
            {opt.label}
          </button>
        ))}
      </div>
      {style === "cards" && <CardsView inputs={inputs} isLive={isLive} />}
      {style === "patchbay" && <PatchbayView inputs={inputs} isLive={isLive} />}
      {style === "groups" && <GroupsView inputs={inputs} isLive={isLive} />}
    </div>
  );
}