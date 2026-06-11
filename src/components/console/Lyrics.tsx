import { useEffect, useMemo } from "react";
import { PenLine } from "lucide-react";
import { useSession } from "@/lib/store/sessions";
import type { Session } from "@/lib/types";

export function Lyrics({ session }: { session: Session }) {
  const { update, flush } = useSession(session.id);
  useEffect(() => () => { flush(session.id); }, [flush, session.id]);

  const value = session.lyrics ?? "";
  const { words, lines } = useMemo(() => {
    const trimmed = value.trim();
    return {
      words: trimmed ? trimmed.split(/\s+/).length : 0,
      lines: trimmed ? trimmed.split(/\n/).length : 0,
    };
  }, [value]);

  return (
    <div className="panel">
      <div className="panel-header">
        <div className="panel-icon">
          <PenLine className="h-4 w-4" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="panel-title">Lyrics</div>
          <div className="panel-subtitle">Use [Verse 1], [Chorus]… to mark sections</div>
        </div>
        <div className="label-mono tabular-nums shrink-0">{lines} lines · {words} words</div>
      </div>
      <textarea
        value={value}
        onChange={(e) => update(session.id, { lyrics: e.target.value })}
        onBlur={() => flush(session.id)}
        placeholder={"[Verse 1]\nWoke up to the sound of\n\n[Chorus]\nSomething we can't name…"}
        className="w-full min-h-[360px] bg-transparent p-4 text-sm font-mono leading-relaxed outline-none resize-y"
      />
    </div>
  );
}