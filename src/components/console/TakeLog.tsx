import { useState } from "react";
import { Plus, Star, Trash2, Check, X, ListMusic } from "lucide-react";
import { useSession, helpers } from "@/lib/store/sessions";
import type { Session, TakeRating } from "@/lib/types";
import { cn } from "@/lib/utils";
import { AudioAttachment } from "@/components/console/AudioAttachment";

const ratingMap: Record<TakeRating, { label: string; cls: string; Icon: typeof Star }> = {
  keeper: { label: "Keeper", cls: "bg-success/20 text-success border-success/30", Icon: Star },
  alt: { label: "Alt", cls: "bg-info/20 text-info border-info/30", Icon: Check },
  reject: { label: "Reject", cls: "bg-destructive/20 text-destructive border-destructive/30", Icon: X },
  unrated: { label: "—", cls: "bg-surface-2 text-muted-foreground border-border", Icon: Star },
};

export function TakeLog({ session }: { session: Session }) {
  const { update } = useSession(session.id);
  const takes = session.takes ?? [];
  const [song, setSong] = useState("");
  const [num, setNum] = useState("");

  const setTakes = (fn: (t: typeof takes) => typeof takes) =>
    update(session.id, (s) => ({ ...s, takes: fn(s.takes ?? []) }));

  const add = () => {
    if (!song.trim()) return;
    const next = helpers.newTake(song, num || String((takes.filter(t => t.song === song).length) + 1));
    setTakes((arr) => [next, ...arr]);
    setNum("");
  };

  return (
    <div className="panel">
      <div className="panel-header">
        <div className="panel-icon">
          <ListMusic className="h-4 w-4" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="panel-title">Take Log</div>
          <div className="panel-subtitle">{takes.length} takes · {takes.filter(t => t.rating === "keeper").length} keepers</div>
        </div>
      </div>

      <div className="p-3 border-b border-border flex flex-wrap gap-2">
        <input value={song} onChange={(e) => setSong(e.target.value)} placeholder="Song / part"
          onKeyDown={(e) => e.key === "Enter" && add()}
          className="flex-1 min-w-[140px] bg-input border border-border rounded-sm px-3 py-1.5 text-sm outline-none focus:ring-1 focus:ring-primary" />
        <input value={num} onChange={(e) => setNum(e.target.value)} placeholder="Take #"
          onKeyDown={(e) => e.key === "Enter" && add()}
          className="w-24 bg-input border border-border rounded-sm px-3 py-1.5 text-sm font-mono outline-none focus:ring-1 focus:ring-primary" />
        <button onClick={add}
          className="flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-sm bg-gradient-amber text-primary-foreground font-semibold hover:opacity-90">
          <Plus className="h-4 w-4" /> Log take
        </button>
      </div>

      <div className="max-h-[640px] overflow-auto divide-y divide-border/60">
        {takes.map((t) => {
          const r = ratingMap[t.rating];
          return (
            <div key={t.id} className="px-4 py-3 hover:bg-surface-2/40 group animate-fade-in">
              <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
                <span className="font-mono text-xs text-muted-foreground tabular-nums shrink-0">
                  {new Date(t.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: false })}
                </span>
                <span className="font-display font-semibold truncate min-w-0">{t.song}</span>
                <span className="font-mono text-xs text-primary shrink-0">#{t.number}</span>
                <span className={cn("ml-auto px-2 py-0.5 rounded-full text-[10px] uppercase tracking-wider border shrink-0", r.cls)}>
                  {r.label}
                </span>
                <button onClick={() => setTakes((arr) => arr.filter((x) => x.id !== t.id))}
                  className="text-muted-foreground hover:text-destructive transition shrink-0 sm:opacity-0 sm:group-hover:opacity-100">
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
              <div className="flex items-center gap-1 mt-2 flex-wrap">
                {(["keeper", "alt", "reject", "unrated"] as TakeRating[]).map((rt) => (
                  <button key={rt} onClick={() =>
                    setTakes((arr) => arr.map((x) => x.id === t.id ? { ...x, rating: rt } : x))}
                    className={cn(
                      "text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-sm transition",
                      t.rating === rt ? ratingMap[rt].cls + " border" : "text-muted-foreground hover:text-foreground"
                    )}>
                    {ratingMap[rt].label}
                  </button>
                ))}
              </div>
              <textarea
                value={t.notes}
                onChange={(e) =>
                  setTakes((arr) => arr.map((x) => x.id === t.id ? { ...x, notes: e.target.value } : x))}
                placeholder="Take notes — performance, tuning, vibe…"
                rows={2}
                className="mt-2 w-full bg-surface-2/40 hover:bg-surface-2/70 focus:bg-surface-2 text-xs px-2.5 py-2 rounded-sm outline-none focus:ring-1 focus:ring-primary resize-y font-mono leading-relaxed"
              />
              <div className="mt-2">
                <AudioAttachment
                  fileUrl={t.fileUrl}
                  fileName={t.fileName}
                  onChange={(next) => setTakes((arr) => arr.map((x) => x.id === t.id ? { ...x, ...next } : x))}
                />
              </div>
            </div>
          );
        })}
        {takes.length === 0 && (
          <div className="p-8 text-center text-muted-foreground text-sm">No takes logged yet.</div>
        )}
      </div>
    </div>
  );
}