import { useSession } from "@/lib/store/sessions";
import type { Session } from "@/lib/types";

export function SessionMeta({ session }: { session: Session }) {
  const { update } = useSession(session.id);
  const fields: { key: keyof Session; label: string; placeholder: string }[] = session.type === "recording"
    ? [
        { key: "sampleRate", label: "Format", placeholder: "48 kHz / 24-bit" },
        { key: "bpm", label: "BPM", placeholder: "120" },
        { key: "key", label: "Key", placeholder: "Am" },
      ]
    : [
        { key: "sampleRate", label: "Format", placeholder: "48 kHz / 24-bit" },
        { key: "lufsTarget", label: "LUFS Target", placeholder: "-14 LUFS" },
        { key: "truePeakTarget", label: "True Peak", placeholder: "-1 dBTP" },
      ];

  return (
    <div className="panel p-4 grid grid-cols-3 gap-3">
      {fields.map((f) => (
        <label key={f.key} className="block">
          <div className="label-mono mb-1">{f.label}</div>
          <input
            value={(session[f.key] ?? "") as string}
            onChange={(e) => update(session.id, { [f.key]: e.target.value } as Partial<Session>)}
            placeholder={f.placeholder}
            className="w-full bg-input border border-border rounded-sm px-2 py-1.5 text-sm outline-none focus:ring-1 focus:ring-primary font-mono"
          />
        </label>
      ))}
    </div>
  );
}
