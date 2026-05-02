import { Plus, Check, Trash2 } from "lucide-react";
import { useState } from "react";
import { useSession, helpers } from "@/lib/store/sessions";
import type { Session } from "@/lib/types";
import { cn } from "@/lib/utils";

export function MixChecklist({ session }: { session: Session }) {
  const { update } = useSession(session.id);
  const items = session.checklist ?? [];
  const [adding, setAdding] = useState<string | null>(null);
  const [text, setText] = useState("");

  const setItems = (fn: (i: typeof items) => typeof items) =>
    update(session.id, (s) => ({ ...s, checklist: fn(s.checklist ?? []) }));

  const grouped = items.reduce<Record<string, typeof items>>((acc, i) => {
    (acc[i.group] ||= []).push(i);
    return acc;
  }, {});

  const done = items.filter((i) => i.done).length;
  const pct = items.length ? Math.round((done / items.length) * 100) : 0;

  return (
    <div className="panel">
      <div className="px-4 py-3 border-b border-border">
        <div className="flex items-center justify-between">
          <div>
            <div className="font-display font-semibold">
              {session.type === "live" ? "Soundcheck Checklist" : "Mix Checklist"}
            </div>
            <div className="label-mono mt-0.5">{done}/{items.length} complete</div>
          </div>
          <div className="font-mono text-2xl text-primary tabular-nums">{pct}%</div>
        </div>
        <div className="mt-3 h-1 bg-surface-3 rounded-full overflow-hidden">
          <div className="h-full bg-gradient-amber transition-all" style={{ width: `${pct}%` }} />
        </div>
      </div>

      <div className="p-3 space-y-4 max-h-[600px] overflow-auto">
        {Object.entries(grouped).map(([group, list]) => (
          <div key={group}>
            <div className="flex items-center justify-between mb-2 px-1">
              <div className="label-mono">{group}</div>
              <button onClick={() => { setAdding(group); setText(""); }}
                className="text-muted-foreground hover:text-foreground"><Plus className="h-3.5 w-3.5" /></button>
            </div>
            <ul className="space-y-1">
              {list.map((i) => (
                <li key={i.id} className="flex items-center gap-2 group">
                  <button onClick={() =>
                    setItems((arr) => arr.map((x) => x.id === i.id ? { ...x, done: !x.done } : x))}
                    className={cn(
                      "h-4 w-4 rounded-sm border flex items-center justify-center transition shrink-0",
                      i.done ? "bg-primary border-primary" : "border-border hover:border-primary"
                    )}>
                    {i.done && <Check className="h-3 w-3 text-primary-foreground" />}
                  </button>
                  <span className={cn("text-sm flex-1", i.done && "line-through text-muted-foreground")}>{i.label}</span>
                  <button onClick={() => setItems((arr) => arr.filter((x) => x.id !== i.id))}
                    className="text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100">
                    <Trash2 className="h-3 w-3" />
                  </button>
                </li>
              ))}
              {adding === group && (
                <li className="flex items-center gap-2">
                  <span className="h-4 w-4 rounded-sm border border-border shrink-0" />
                  <input autoFocus value={text} onChange={(e) => setText(e.target.value)}
                    onBlur={() => {
                      if (text.trim()) setItems((arr) => [...arr, { id: helpers.uid(), label: text.trim(), done: false, group }]);
                      setAdding(null); setText("");
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") (e.target as HTMLInputElement).blur();
                      if (e.key === "Escape") { setAdding(null); setText(""); }
                    }}
                    placeholder="New item"
                    className="flex-1 text-sm bg-transparent outline-none border-b border-primary/40" />
                </li>
              )}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}