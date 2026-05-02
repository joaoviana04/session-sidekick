import { Plus, Trash2, GripVertical, ChevronUp, ChevronDown } from "lucide-react";
import { useSession, helpers } from "@/lib/store/sessions";
import type { Session, SetlistSong } from "@/lib/types";

export function Setlist({ session }: { session: Session }) {
  const { update } = useSession(session.id);
  const songs = (session.setlist ?? []).slice().sort((a, b) => a.position - b.position);

  const setSongs = (fn: (s: SetlistSong[]) => SetlistSong[]) =>
    update(session.id, (s) => ({ ...s, setlist: fn(s.setlist ?? []) }));

  const setField = <K extends keyof SetlistSong>(id: string, field: K, value: SetlistSong[K]) =>
    setSongs((arr) => arr.map((s) => (s.id === id ? { ...s, [field]: value } : s)));

  const add = () =>
    setSongs((arr) => [
      ...arr,
      {
        id: helpers.uid(),
        position: arr.length + 1,
        title: "",
        bpm: "",
        key: "",
        duration: "",
        cues: "",
        notes: "",
      },
    ]);

  const move = (id: string, dir: -1 | 1) =>
    setSongs((arr) => {
      const sorted = arr.slice().sort((a, b) => a.position - b.position);
      const idx = sorted.findIndex((s) => s.id === id);
      const swap = idx + dir;
      if (idx < 0 || swap < 0 || swap >= sorted.length) return arr;
      const a = sorted[idx];
      const b = sorted[swap];
      return arr.map((s) => {
        if (s.id === a.id) return { ...s, position: b.position };
        if (s.id === b.id) return { ...s, position: a.position };
        return s;
      });
    });

  const totalDuration = songs.reduce((acc, s) => {
    const m = /^(\d+):(\d{1,2})$/.exec(s.duration.trim());
    return acc + (m ? parseInt(m[1]) * 60 + parseInt(m[2]) : 0);
  }, 0);
  const totalLabel = totalDuration
    ? `${Math.floor(totalDuration / 60)}:${String(totalDuration % 60).padStart(2, "0")}`
    : "—";

  return (
    <div className="panel">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <div>
          <div className="font-display font-semibold">Setlist</div>
          <div className="label-mono mt-0.5">{songs.length} songs · {totalLabel}</div>
        </div>
        <button onClick={add}
          className="flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-sm bg-surface-2 hover:bg-surface-3 transition">
          <Plus className="h-3.5 w-3.5" /> Song
        </button>
      </div>

      <div className="divide-y divide-border/60">
        {songs.map((s, i) => (
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
                <button onClick={() => move(s.id, 1)} disabled={i === songs.length - 1}
                  className="hover:text-foreground disabled:opacity-30">
                  <ChevronDown className="h-3 w-3" />
                </button>
              </div>
              <input
                value={s.title}
                onChange={(e) => setField(s.id, "title", e.target.value)}
                placeholder="Song title"
                className="flex-1 min-w-0 bg-input border border-border rounded-sm px-2 py-1.5 text-sm font-medium outline-none focus:ring-1 focus:ring-primary"
              />
              <button
                onClick={() => setSongs((arr) => arr.filter((x) => x.id !== s.id))}
                className="text-muted-foreground hover:text-destructive p-1.5"
                aria-label="Delete song"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>

            <div className="grid grid-cols-3 gap-2 pl-7">
              <input
                value={s.bpm}
                onChange={(e) => setField(s.id, "bpm", e.target.value)}
                placeholder="BPM"
                className="bg-input border border-border rounded-sm px-2 py-1.5 text-xs font-mono outline-none focus:ring-1 focus:ring-primary"
              />
              <input
                value={s.key}
                onChange={(e) => setField(s.id, "key", e.target.value)}
                placeholder="Key"
                className="bg-input border border-border rounded-sm px-2 py-1.5 text-xs font-mono outline-none focus:ring-1 focus:ring-primary"
              />
              <input
                value={s.duration}
                onChange={(e) => setField(s.id, "duration", e.target.value)}
                placeholder="3:42"
                className="bg-input border border-border rounded-sm px-2 py-1.5 text-xs font-mono outline-none focus:ring-1 focus:ring-primary"
              />
            </div>

            <div className="pl-7 space-y-1.5">
              <input
                value={s.cues}
                onChange={(e) => setField(s.id, "cues", e.target.value)}
                placeholder="Cues (e.g. Scene 04, FX Hall verse, mute gtr2 bridge)"
                className="w-full bg-transparent border border-dashed border-border rounded-sm px-2 py-1.5 text-xs outline-none focus:ring-1 focus:ring-primary focus:border-solid"
              />
              <input
                value={s.notes}
                onChange={(e) => setField(s.id, "notes", e.target.value)}
                placeholder="Notes…"
                className="w-full bg-transparent border border-dashed border-border rounded-sm px-2 py-1.5 text-xs outline-none focus:ring-1 focus:ring-primary focus:border-solid"
              />
            </div>
          </div>
        ))}
        {songs.length === 0 && (
          <div className="px-4 py-8 text-center text-muted-foreground text-sm">No songs in the setlist yet.</div>
        )}
      </div>
    </div>
  );
}
