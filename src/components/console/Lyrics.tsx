import { useEffect, useMemo } from "react";
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
      <div className="px-4 py-3 border-b border-border flex items-center justify-between">
        <div>
          <div className="font-display font-semibold">Lyrics</div>
          <div className="label-mono mt-0.5">Use [Verse 1], [Chorus]… to mark sections</div>
        </div>
        <div className="label-mono tabular-nums">{lines} lines · {words} words</div>
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