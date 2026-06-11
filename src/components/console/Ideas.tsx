import { Plus, Trash2, Lightbulb, Music2, Mic2, Layers, Link2, Hash } from "lucide-react";
import { useSession, helpers } from "@/lib/store/sessions";
import type { Session, IdeaCard, IdeaKind } from "@/lib/types";

const KIND_META: Record<IdeaKind, { label: string; icon: React.ComponentType<{ className?: string }>; color: string }> = {
  lyric: { label: "Lyric", icon: Mic2, color: "text-info" },
  melody: { label: "Melody", icon: Music2, color: "text-primary" },
  chord: { label: "Chord", icon: Hash, color: "text-success" },
  production: { label: "Production", icon: Layers, color: "text-warn" },
  reference: { label: "Reference", icon: Link2, color: "text-accent" },
  other: { label: "Other", icon: Lightbulb, color: "text-muted-foreground" },
};

export function Ideas({ session }: { session: Session }) {
  const { update } = useSession(session.id);
  const ideas = session.ideas ?? [];

  const setIdeas = (fn: (i: IdeaCard[]) => IdeaCard[]) =>
    update(session.id, (s) => ({ ...s, ideas: fn(s.ideas ?? []) }));

  const add = (kind: IdeaKind = "lyric") =>
    setIdeas((arr) => [
      { id: helpers.uid(), kind, title: "", body: "", createdAt: new Date().toISOString() },
      ...arr,
    ]);

  const setField = <K extends keyof IdeaCard>(id: string, field: K, value: IdeaCard[K]) =>
    setIdeas((arr) => arr.map((i) => (i.id === id ? { ...i, [field]: value } : i)));

  return (
    <div className="panel">
      <div className="panel-header">
        <div className="panel-icon">
          <Lightbulb className="h-4 w-4" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="panel-title">Ideas</div>
          <div className="panel-subtitle">{ideas.length} cards · capture before you forget</div>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          {(Object.keys(KIND_META) as IdeaKind[]).map((k) => {
            const Icon = KIND_META[k].icon;
            return (
              <button key={k} onClick={() => add(k)} title={`New ${KIND_META[k].label}`}
                className={`p-1.5 rounded-lg bg-surface-2 hover:bg-surface-3 transition ${KIND_META[k].color}`}>
                <Icon className="h-3.5 w-3.5" />
              </button>
            );
          })}
        </div>
      </div>

      <div className="p-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
        {ideas.map((idea) => {
          const meta = KIND_META[idea.kind];
          const Icon = meta.icon;
          return (
            <div key={idea.id} className="panel p-3 bg-surface-2/40 group relative">
              <div className="flex items-center gap-2 mb-2">
                <select
                  value={idea.kind}
                  onChange={(e) => setField(idea.id, "kind", e.target.value as IdeaKind)}
                  className={`bg-transparent border border-border rounded-sm px-1.5 py-0.5 text-[10px] font-mono uppercase outline-none ${meta.color}`}
                >
                  {(Object.keys(KIND_META) as IdeaKind[]).map((k) => (
                    <option key={k} value={k}>{KIND_META[k].label}</option>
                  ))}
                </select>
                <Icon className={`h-3.5 w-3.5 ${meta.color}`} />
                <span className="label-mono flex-1 truncate">{new Date(idea.createdAt).toLocaleDateString()}</span>
                <button onClick={() => setIdeas((arr) => arr.filter((x) => x.id !== idea.id))}
                  className="text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition">
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
              <input
                value={idea.title}
                onChange={(e) => setField(idea.id, "title", e.target.value)}
                placeholder="Title"
                className="w-full bg-transparent text-base font-display font-semibold outline-none focus:bg-input/40 rounded-sm px-1 mb-1"
              />
              <textarea
                value={idea.body}
                onChange={(e) => setField(idea.id, "body", e.target.value)}
                placeholder="Describe the idea, hum the melody in words, paste a chord progression…"
                className="w-full min-h-[80px] bg-transparent text-xs font-mono leading-relaxed outline-none resize-y"
              />
            </div>
          );
        })}
        {ideas.length === 0 && (
          <div className="col-span-full px-4 py-8 text-center text-muted-foreground text-sm">
            No ideas yet. <button onClick={() => add()} className="text-primary hover:underline">Drop the first one</button>.
          </div>
        )}
      </div>
    </div>
  );
}