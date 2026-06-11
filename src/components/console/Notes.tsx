import { useEffect } from "react";
import { FileText } from "lucide-react";
import { useSession } from "@/lib/store/sessions";
import type { Session } from "@/lib/types";

export function Notes({ session }: { session: Session }) {
  const { update, flush } = useSession(session.id);
  // Make sure any pending debounced write is committed when the user leaves
  // the session view (route change / tab switch).
  useEffect(() => {
    return () => {
      flush(session.id);
    };
  }, [flush, session.id]);
  return (
    <div className="panel">
      <div className="panel-header">
        <div className="panel-icon">
          <FileText className="h-4 w-4" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="panel-title">Session Notes</div>
          <div className="panel-subtitle">Markdown-ish · auto-saved</div>
        </div>
      </div>
      <textarea
        value={session.notes}
        onChange={(e) => update(session.id, { notes: e.target.value })}
        onBlur={() => flush(session.id)}
        placeholder={"# Session goals\n- ...\n\n# Headphone mixes\n- Drums: more click"}
        className="w-full min-h-[300px] bg-transparent p-4 text-sm font-mono outline-none resize-y" />
    </div>
  );
}
