import { useParams, Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Mic, Sliders, Zap, Download, FolderOpen, User, Wand2, Maximize2, PenLine, Info, FileStack } from "lucide-react";
import { AppShell } from "@/components/console/AppShell";
import { useSessions } from "@/lib/store/sessions";
import { useProjects } from "@/lib/store/projects";
import { useClients } from "@/lib/store/clients";
import { SessionTimer } from "@/components/console/SessionTimer";
import { SessionMeta } from "@/components/console/SessionMeta";
import { InputList } from "@/components/console/InputList";
import { TakeLog } from "@/components/console/TakeLog";
import { Notes } from "@/components/console/Notes";
import { MixChecklist } from "@/components/console/MixChecklist";
import { References } from "@/components/console/References";
import { Revisions } from "@/components/console/Revisions";
import { TapTempo } from "@/components/console/TapTempo";
import { MonitorMixes } from "@/components/console/MonitorMixes";
import { Setlist } from "@/components/console/Setlist";
import { ShowLog } from "@/components/console/ShowLog";
import { Lyrics } from "@/components/console/Lyrics";
import { SongStructure } from "@/components/console/SongStructure";
import { Ideas } from "@/components/console/Ideas";
import { Instrumentation } from "@/components/console/Instrumentation";
import { exportSessionPdf } from "@/lib/exportPdf";
import { toast } from "@/hooks/use-toast";
import { useSessionTemplates, pickTemplateData } from "@/lib/store/templates";
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const SessionView = () => {
  const { id } = useParams<{ id: string }>();
  const { sessions, update, create } = useSessions();
  const nav = useNavigate();
  const { projects } = useProjects();
  const { clients } = useClients();
  const session = sessions.find((s) => s.id === id);
  const { create: createTemplate } = useSessionTemplates();
  const [templateDialogOpen, setTemplateDialogOpen] = useState(false);
  const [templateName, setTemplateName] = useState("");
  const [savingTemplate, setSavingTemplate] = useState(false);

  if (!session) {
    return (
      <AppShell>
        <div className="p-10">
          <Link to="/" className="text-sm text-muted-foreground hover:text-foreground inline-flex items-center gap-1">
            <ArrowLeft className="h-4 w-4" /> Back
          </Link>
          <div className="mt-8 text-center text-muted-foreground">Session not found.</div>
        </div>
      </AppShell>
    );
  }

  const Icon =
    session.type === "recording" ? Mic
    : session.type === "mix" ? Sliders
    : session.type === "compose" ? PenLine
    : Zap;
  const accent =
    session.type === "recording" ? "text-info"
    : session.type === "mix" ? "text-primary"
    : session.type === "compose" ? "text-accent"
    : "text-success";
  const typeLabel =
    session.type === "recording" ? "tracking session"
    : session.type === "mix" ? "mix session"
    : session.type === "compose" ? "compose session"
    : "live session";

  const project = projects.find((p) => p.id === session.projectId) ?? null;
  const client = project ? clients.find((c) => c.id === project.clientId) ?? null : null;

  const startMixFromRecording = async () => {
    const baseTitle = session.title?.trim() || "Untitled";
    const mixTitle = /\bmix\b/i.test(baseTitle) ? baseTitle : `${baseTitle} — Mix`;
    try {
      const created = await create("mix", mixTitle, session.artist || "", session.projectId ?? null);
      // Seed mix session with metadata + a tracked-from reference + a checklist derived from the inputs.
      const trackedSongs = Array.from(
        new Set((session.takes ?? []).map((t) => (t.song || "").trim()).filter(Boolean)),
      );
      const trackedSummary = trackedSongs.length
        ? `Songs tracked: ${trackedSongs.join(", ")}\n\n`
        : "";
      const recapNotes =
        `${trackedSummary}Mixing from recording session "${baseTitle}"` +
        (session.notes ? `\n\n— Tracking notes —\n${session.notes}` : "");
      const seedChecklist = (session.inputs ?? [])
        .filter((i) => (i.source || i.mic))
        .slice(0, 24)
        .map((i) => ({
          id: Math.random().toString(36).slice(2, 10),
          label: `Process ${i.source || i.mic}${i.ch ? ` (ch ${i.ch})` : ""}`,
          done: false,
          group: "From recording",
        }));
      await update(created.id, {
        bpm: session.bpm,
        key: session.key,
        sampleRate: session.sampleRate,
        notes: recapNotes,
        checklist: seedChecklist,
      });
      toast({ title: "Mix session created", description: "Seeded from this recording." });
      nav(`/session/${created.id}`);
    } catch (e: any) {
      toast({ title: "Could not create mix session", description: e?.message ?? "Try again.", variant: "destructive" });
    }
  };

  const saveTemplate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (savingTemplate) return;
    setSavingTemplate(true);
    try {
      await createTemplate(session.type, templateName.trim() || session.title || "Untitled template", pickTemplateData(session));
      toast({ title: "Template saved", description: "Use it next time you start a new session." });
      setTemplateDialogOpen(false);
      setTemplateName("");
    } catch (err: any) {
      toast({ title: "Could not save template", description: err?.message ?? "Try again.", variant: "destructive" });
    } finally {
      setSavingTemplate(false);
    }
  };

  return (
    <AppShell>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 py-6 sm:py-8">
        <Link to="/" className="text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1 mb-4">
          <ArrowLeft className="h-3.5 w-3.5" /> Sessions
        </Link>

        <div className="panel mb-6">
          <div className="p-5 sm:p-6 flex flex-wrap items-start gap-5">
            <div className={`h-12 w-12 rounded-xl bg-surface-2 grid place-items-center shrink-0 ${accent}`}>
              <Icon className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="label-mono mb-1.5">{typeLabel}</div>
              <input value={session.title}
                onChange={(e) => update(session.id, { title: e.target.value })}
                className="font-display text-2xl md:text-3xl font-bold bg-transparent outline-none focus:bg-surface-2 rounded-lg px-1.5 -ml-1.5 w-full" />
              <input value={session.artist}
                onChange={(e) => update(session.id, { artist: e.target.value })}
                placeholder="Artist / project name"
                className="block text-sm text-muted-foreground bg-transparent outline-none focus:bg-surface-2 rounded-lg px-1.5 -ml-1.5 mt-1 w-full" />
            </div>
            <div className="flex flex-col items-center gap-2">
              <TapTempo />
              <SessionTimer session={session} />
            </div>
          </div>
          <div className="px-5 sm:px-6 pb-5 sm:pb-6 flex flex-wrap gap-2">
            <button
              onClick={() => exportSessionPdf(session, project, client)}
              className="inline-flex items-center justify-center gap-1.5 text-xs font-medium px-3 py-2 rounded-lg bg-surface-2 hover:bg-surface-3 transition"
              title="Export session as PDF"
            >
              <Download className="h-3.5 w-3.5" /> Export PDF
            </button>
            <button
              onClick={() => { setTemplateName(session.title || ""); setTemplateDialogOpen(true); }}
              className="inline-flex items-center justify-center gap-1.5 text-xs font-medium px-3 py-2 rounded-lg bg-surface-2 hover:bg-surface-3 transition"
              title="Save this session's setup as a reusable template"
            >
              <FileStack className="h-3.5 w-3.5" /> Save as template
            </button>
            {session.type === "recording" && (
              <button
                onClick={startMixFromRecording}
                className="inline-flex items-center justify-center gap-1.5 text-xs font-medium px-3 py-2 rounded-lg bg-gradient-amber text-primary-foreground hover:opacity-90 transition shadow-led"
                title="Create a new mix session seeded from this recording"
              >
                <Wand2 className="h-3.5 w-3.5" /> Start mix from this
              </button>
            )}
            {session.type === "live" && (
              <Link
                to={`/session/${session.id}/show`}
                className="inline-flex items-center justify-center gap-1.5 text-xs font-medium px-3 py-2 rounded-lg bg-gradient-amber text-primary-foreground hover:opacity-90 transition shadow-led"
                title="Fullscreen Show Mode for FOH"
              >
                <Maximize2 className="h-3.5 w-3.5" /> Show Mode
              </Link>
            )}
          </div>
        </div>

        <div className="panel mb-6">
          <div className="panel-header">
            <div className="panel-icon">
              <Info className="h-4 w-4" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="panel-title">Session details</div>
              <div className="panel-subtitle">Project, client &amp; format</div>
            </div>
          </div>
          <div className="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            <label className="block">
              <div className="label-mono mb-1 flex items-center gap-1.5">
                <FolderOpen className="h-3 w-3" /> Project
              </div>
              <select
                value={session.projectId ?? ""}
                onChange={(e) => update(session.id, { projectId: e.target.value || null })}
                className="w-full bg-input border border-border rounded-sm px-2 py-1.5 text-sm outline-none focus:ring-1 focus:ring-primary font-mono"
              >
                <option value="">— No project —</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </label>
            <label className="block">
              <div className="label-mono mb-1 flex items-center gap-1.5">
                <User className="h-3 w-3" /> Client
              </div>
              <div className="w-full bg-input/60 border border-transparent rounded-sm px-2 py-1.5 text-sm font-mono truncate text-muted-foreground">
                {client ? client.name : project ? "— project has no client —" : "— assign a project first —"}
              </div>
            </label>
            <SessionMeta session={session} />
          </div>
        </div>

        {session.type === "recording" ? (
          <div className="grid lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <InputList session={session} />
              <TakeLog session={session} />
            </div>
            <div className="space-y-6">
              <Notes session={session} />
            </div>
          </div>
        ) : session.type === "mix" ? (
          <div className="grid lg:grid-cols-3 gap-6">
            <div className="space-y-6">
              <MixChecklist session={session} />
            </div>
            <div className="lg:col-span-2 space-y-6">
              <Revisions session={session} />
              <References session={session} />
              <Notes session={session} />
            </div>
          </div>
        ) : session.type === "compose" ? (
          <div className="grid lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <Ideas session={session} />
              <Lyrics session={session} />
              <SongStructure session={session} />
            </div>
            <div className="space-y-6">
              <Instrumentation session={session} />
              <References session={session} />
              <Notes session={session} />
            </div>
          </div>
        ) : (
          <div className="grid lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <InputList session={session} />
              <Setlist session={session} />
              <ShowLog session={session} />
            </div>
            <div className="space-y-6">
              <MixChecklist session={session} />
              <MonitorMixes session={session} />
              <Notes session={session} />
            </div>
          </div>
        )}
      </div>

      <Dialog open={templateDialogOpen} onOpenChange={setTemplateDialogOpen}>
        <DialogContent className="bg-surface-1 border-border">
          <DialogHeader>
            <DialogTitle className="font-display">Save as template</DialogTitle>
            <DialogDescription>
              Stores this session's setup (inputs, checklist, monitor mixes, setlist, structure, targets, etc.) so you can reuse it for new {session.type} sessions.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={saveTemplate} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="template-name" className="label-mono">Template name</Label>
              <Input id="template-name" value={templateName} onChange={(e) => setTemplateName(e.target.value)}
                placeholder="e.g. Standard drum tracking setup" className="bg-input border-border" autoFocus required />
            </div>
            <button type="submit" disabled={savingTemplate}
              className="w-full rounded-sm bg-gradient-amber text-primary-foreground py-2.5 font-semibold hover:opacity-90 transition disabled:opacity-50">
              {savingTemplate ? "Saving..." : "Save template"}
            </button>
          </form>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
};

export default SessionView;
