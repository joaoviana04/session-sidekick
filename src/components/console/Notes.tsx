import { useSession } from "@/lib/store/sessions";
import type { Session } from "@/lib/types";

export function Notes({ session }: { session: Session }) {
  const { update } = useSession(session.id);
  return (
    <div className="panel">
      <div className="px-4 py-3 border-b border-border">
        <div className="font-display font-semibold">Session Notes</div>
        <div className="label-mono mt-0.5">Markdown-ish - auto-saved</div>
      </div>
      <textarea value={session.notes} onChange={(e) => update(session.id, { notes: e.target.value })}
        placeholder={"# Session goals\n- ...\n\n# Headphone mixes\n- Drums: more click"}
        className="w-full min-h-[300px] bg-transparent p-4 text-sm font-mono outline-none resize-y" />
    </div>
  );
}
