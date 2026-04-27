import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Mic, Sliders } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useSessions } from "@/lib/store/sessions";
import { cn } from "@/lib/utils";
import type { SessionType } from "@/lib/types";

export function NewSessionDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const [type, setType] = useState<SessionType>("recording");
  const [title, setTitle] = useState("");
  const [artist, setArtist] = useState("");
  const { create } = useSessions();
  const nav = useNavigate();

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const s = create(type, title, artist);
    setTitle(""); setArtist("");
    onOpenChange(false);
    nav(`/session/${s.id}`);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-surface-1 border-border">
        <DialogHeader>
          <DialogTitle className="font-display">New session</DialogTitle>
          <DialogDescription>Pick a session type and label it. You can change everything later.</DialogDescription>
        </DialogHeader>

        <form onSubmit={submit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            {([
              { v: "recording", label: "Recording", desc: "Inputs · Takes · Notes", icon: Mic, color: "text-info" },
              { v: "mix", label: "Mix", desc: "Checklist · Refs · Revisions", icon: Sliders, color: "text-primary" },
            ] as const).map((o) => (
              <button type="button" key={o.v} onClick={() => setType(o.v)}
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
              placeholder={type === "recording" ? "e.g. Drums tracking — Song A" : "e.g. Single — Mix v3"}
              className="bg-input border-border" autoFocus />
          </div>
          <div className="space-y-2">
            <Label htmlFor="artist" className="label-mono">Artist / Client</Label>
            <Input id="artist" value={artist} onChange={(e) => setArtist(e.target.value)}
              placeholder="e.g. The Band" className="bg-input border-border" />
          </div>

          <button type="submit"
            className="w-full rounded-sm bg-gradient-amber text-primary-foreground py-2.5 font-semibold hover:opacity-90 transition">
            Open session →
          </button>
        </form>
      </DialogContent>
    </Dialog>
  );
}