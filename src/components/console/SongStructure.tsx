import { Plus, Trash2, ChevronUp, ChevronDown } from "lucide-react";
import { useSession, helpers } from "@/lib/store/sessions";
import type { Session, SongSection, SongSectionType } from "@/lib/types";

const SECTION_TYPES: SongSectionType[] = [
  "intro", "verse", "pre-chorus", "chorus", "bridge", "solo", "breakdown", "outro", "interlude", "custom",
];

const SECTION_COLOR: Record<SongSectionType, string> = {
  intro: "text-info",
  verse: "text-foreground",
  "pre-chorus": "text-warn",
  chorus: "text-primary",
  bridge: "text-success",
  solo: "text-accent",
  breakdown: "text-muted-foreground",
  outro: "text-info",
  interlude: "text-muted-foreground",
  custom: "text-muted-foreground",
};

export function SongStructure({ session }: { session: Session }) {
  const { update } = useSession(session.id);
  const sections = (session.structure ?? []).slice().sort((a, b) => a.position - b.position);

  const setSections = (fn: (s: SongSection[]) => SongSection[]) =>
    update(session.id, (s) => ({ ...s, structure: fn(s.structure ?? []) }));

  const setField = <K extends keyof SongSection>(id: string, field: K, value: SongSection[K]) =>
    setSections((arr) => arr.map((s) => (s.id === id ? { ...s, [field]: value } : s)));

  const add = (type: SongSectionType = "verse") =>
    setSections((arr) => [
      ...arr,
      { id: helpers.uid(), position: arr.length + 1, type, label: "", bars: "", chords: "", notes: "" },
    ]);

  const move = (id: string, dir: -1 | 1) =>
    setSections((arr) => {
      const sorted = arr.slice().sort((a, b) => a.position - b.position);
      const idx = sorted.findIndex((s) => s.id === id);
      const swap = idx + dir;
      if (idx < 0 || swap < 0 || swap >= sorted.length) return arr;
      const a = sorted[idx]; const b = sorted[swap];
      return arr.map((s) => {
        if (s.id === a.id) return { ...s, position: b.position };
        if (s.id === b.id) return { ...s, position: a.position };
        return s;
      });
    });

  const totalBars = sections.reduce((acc, s) => {
    const m = /^\s*(\d+)/.exec(s.bars);
    return acc + (m ? parseInt(m[1]) : 0);
  }, 0);

  return (
    <div className="panel">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <div>
          <div className="font-display font-semibold">Structure</div>
          <div className="label-mono mt-0.5">{sections.length} sections · {totalBars || "—"} bars total</div>
        </div>
        <button onClick={() => add()}
          className="flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-sm bg-surface-2 hover:bg-surface-3 transition">
          <Plus className="h-3.5 w-3.5" /> Section
        </button>
      </div>

      <div className="divide-y divide-border/60">
        {sections.map((s, i) => (
          <div key={s.id} className="p-3 space-y-2">
            <div className="flex items-center gap-2">
              <div className="flex flex-col items-center text-muted-foreground">
                <button onClick={() => move(s.id, -1)} disabled={i === 0}
                  className="hover:text-foreground disabled:opacity-30">
                  <ChevronUp className="h-3 w-3" />
                </button>
                <span className="font-mono text-xs text-primary tabular-nums">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <button onClick={() => move(s.id, 1)} disabled={i === sections.length - 1}
                  className="hover:text-foreground disabled:opacity-30">
                  <ChevronDown className="h-3 w-3" />
                </button>
              </div>
              <select
                value={s.type}
                onChange={(e) => setField(s.id, "type", e.target.value as SongSectionType)}
                className={`bg-input border border-border rounded-sm px-2 py-1.5 text-xs font-mono uppercase outline-none focus:ring-1 focus:ring-primary ${SECTION_COLOR[s.type]}`}
              >
                {SECTION_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
              <input
                value={s.label}
                onChange={(e) => setField(s.id, "label", e.target.value)}
                placeholder="Label (e.g. Verse 1)"
                className="flex-1 min-w-0 bg-input border border-border rounded-sm px-2 py-1.5 text-sm outline-none focus:ring-1 focus:ring-primary"
              />
              <input
                value={s.bars}
                onChange={(e) => setField(s.id, "bars", e.target.value)}
                placeholder="Bars"
                className="w-20 bg-input border border-border rounded-sm px-2 py-1.5 text-xs font-mono outline-none focus:ring-1 focus:ring-primary"
              />
              <button onClick={() => setSections((arr) => arr.filter((x) => x.id !== s.id))}
                className="text-muted-foreground hover:text-destructive p-1.5" aria-label="Delete section">
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
            <div className="pl-7 space-y-1.5">
              <input
                value={s.chords}
                onChange={(e) => setField(s.id, "chords", e.target.value)}
                placeholder="Chords (e.g. Am — F — C — G)"
                className="w-full bg-transparent border border-dashed border-border rounded-sm px-2 py-1.5 text-xs font-mono outline-none focus:ring-1 focus:ring-primary focus:border-solid"
              />
              <input
                value={s.notes}
                onChange={(e) => setField(s.id, "notes", e.target.value)}
                placeholder="Notes (arrangement, dynamics…)"
                className="w-full bg-transparent border border-dashed border-border rounded-sm px-2 py-1.5 text-xs outline-none focus:ring-1 focus:ring-primary focus:border-solid"
              />
            </div>
          </div>
        ))}
        {sections.length === 0 && (
          <div className="px-4 py-8 text-center text-muted-foreground text-sm">No sections yet. Map the song.</div>
        )}
      </div>
    </div>
  );
}