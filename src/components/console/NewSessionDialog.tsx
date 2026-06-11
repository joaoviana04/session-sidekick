import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Mic, Sliders, Radio, PenLine, FileStack } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useSessions } from "@/lib/store/sessions";
import { useProjects } from "@/lib/store/projects";
import { useSessionTemplates } from "@/lib/store/templates";
import { cn } from "@/lib/utils";
import type { SessionType } from "@/lib/types";

export function NewSessionDialog({
  open, onOpenChange, defaultProjectId,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  defaultProjectId?: string | null;
}) {
  const [type, setType] = useState<SessionType>("recording");
  const [title, setTitle] = useState("");
  const [artist, setArtist] = useState("");
  const [projectId, setProjectId] = useState<string | null>(defaultProjectId ?? null);
  const [templateId, setTemplateId] = useState<string>("");
  const [busy, setBusy] = useState(false);
  const { create, update } = useSessions();
  const { projects } = useProjects();
  const { templates } = useSessionTemplates(type);
  const nav = useNavigate();

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    try {
      const s = await create(type, title, artist, projectId);
      const template = templates.find((t) => t.id === templateId);
      if (template) await update(s.id, template.data);
      setTitle(""); setArtist(""); setTemplateId("");
      onOpenChange(false);
      nav(`/session/${s.id}`);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-surface-1 border-border">
        <DialogHeader>
          <DialogTitle className="font-display">New session</DialogTitle>
          <DialogDescription>Pick a session type and label it. You can change everything later.</DialogDescription>
        </DialogHeader>

        <form onSubmit={submit} className="space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {([
              { v: "recording", label: "Recording", desc: "Inputs - Takes - Notes", icon: Mic, color: "text-info" },
              { v: "mix", label: "Mix", desc: "Checklist - Refs - Revisions", icon: Sliders, color: "text-primary" },
              { v: "live", label: "Live", desc: "Patch - Monitors - Setlist", icon: Radio, color: "text-success" },
              { v: "compose", label: "Compose", desc: "Lyrics - Structure - Ideas", icon: PenLine, color: "text-accent" },
            ] as const).map((o) => (
              <button type="button" key={o.v} onClick={() => { setType(o.v); setTemplateId(""); }}
                className={cn(
                  "panel p-4 text-left transition-all",
                  type === o.v ? "ring-1 ring-primary border-primary/50" : "opacity-70 hover:opacity-100"
                )}>
                <o.icon className={cn("h-5 w-5 mb-2", o.color)} />
                <div className="font-display font-semibold">{o.label}</div>
                <div className="label-mono mt-1">{o.desc}</div>
              </button>
            ))}
          </div>

          <div className="space-y-2">
            <Label htmlFor="title" className="label-mono">Title</Label>
            <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)}
              placeholder={
                type === "recording" ? "e.g. Drums tracking - Song A"
                : type === "mix" ? "e.g. Single - Mix v3"
                : type === "compose" ? "e.g. Song A - writing session"
                : "e.g. Tour - Lisbon - Coliseu"
              }
              className="bg-input border-border" autoFocus required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="artist" className="label-mono">{type === "live" ? "Artist / Band" : "Artist / Client"}</Label>
            <Input id="artist" value={artist} onChange={(e) => setArtist(e.target.value)}
              placeholder="e.g. The Band" className="bg-input border-border" />
          </div>
          {templates.length > 0 && (
            <div className="space-y-2">
              <Label htmlFor="template" className="label-mono flex items-center gap-1.5">
                <FileStack className="h-3.5 w-3.5" /> Start from template
              </Label>
              <select id="template" value={templateId} onChange={(e) => setTemplateId(e.target.value)}
                className="w-full bg-input border border-border rounded-sm px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary">
                <option value="">— Blank session —</option>
                {templates.map((t) => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="project" className="label-mono">Project</Label>
            <select id="project" value={projectId ?? ""} onChange={(e) => setProjectId(e.target.value || null)}
              className="w-full bg-input border border-border rounded-sm px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary">
              <option value="">— No project (loose session) —</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>

          <button type="submit" disabled={busy}
            className="w-full rounded-sm bg-gradient-amber text-primary-foreground py-2.5 font-semibold hover:opacity-90 transition disabled:opacity-50">
            {busy ? "Creating..." : "Open session →"}
          </button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
