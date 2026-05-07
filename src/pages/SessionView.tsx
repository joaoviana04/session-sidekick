import { useParams, Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Mic, Sliders, Zap, Download, FolderOpen, User, Wand2 } from "lucide-react";
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
import { exportSessionPdf } from "@/lib/exportPdf";
import { toast } from "@/hooks/use-toast";

const SessionView = () => {
  const { id } = useParams<{ id: string }>();
  const { sessions, update, create } = useSessions();
  const nav = useNavigate();
  const { projects } = useProjects();
  const { clients } = useClients();
  const session = sessions.find((s) => s.id === id);

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

  const Icon = session.type === "recording" ? Mic : session.type === "mix" ? Sliders : Zap;
  const accent =
    session.type === "recording" ? "text-info" : session.type === "mix" ? "text-primary" : "text-success";
  const typeLabel =
    session.type === "recording" ? "tracking session" : session.type === "mix" ? "mix session" : "live session";

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

  return (
    <AppShell>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 py-6 sm:py-8">
        <Link to="/" className="text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1 mb-4">
          <ArrowLeft className="h-3.5 w-3.5" /> Sessions
        </Link>

        <header className="flex flex-wrap items-start gap-4 mb-6">
          <div className={`h-12 w-12 rounded-sm bg-surface-2 grid place-items-center ${accent}`}>
            <Icon className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="label-mono">{typeLabel}</div>
            <input value={session.title}
              onChange={(e) => update(session.id, { title: e.target.value })}
              className="font-display text-2xl md:text-3xl font-bold bg-transparent outline-none focus:bg-surface-2 rounded-sm px-1 -ml-1 w-full" />
            <input value={session.artist}
              onChange={(e) => update(session.id, { artist: e.target.value })}
              className="block text-base md:text-sm text-muted-foreground bg-transparent outline-none focus:bg-surface-2 rounded-sm px-1 -ml-1 mt-1 w-full" />
          </div>
          <div className="w-full sm:w-auto sm:min-w-[240px] flex flex-col gap-2">
            <SessionTimer session={session} />
            <button
              onClick={() => exportSessionPdf(session, project, client)}
              className="flex items-center justify-center gap-1.5 text-xs px-2.5 py-1.5 rounded-sm bg-surface-2 hover:bg-surface-3 transition"
              title="Export session as PDF"
            >
              <Download className="h-3.5 w-3.5" /> Export PDF
            </button>
            {session.type === "recording" && (
              <button
                onClick={startMixFromRecording}
                className="flex items-center justify-center gap-1.5 text-xs px-2.5 py-1.5 rounded-sm bg-gradient-amber text-primary-foreground hover:opacity-90 transition"
                title="Create a new mix session seeded from this recording"
              >
                <Wand2 className="h-3.5 w-3.5" /> Start mix from this
              </button>
            )}
          </div>
        </header>

        <div className="panel p-3 mb-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
          <label className="flex items-center gap-2 min-w-0">
            <FolderOpen className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
            <span className="label-mono shrink-0">Project</span>
            <select
              value={session.projectId ?? ""}
              onChange={(e) => update(session.id, { projectId: e.target.value || null })}
              className="flex-1 min-w-0 bg-input border border-border rounded-sm px-2 py-1.5 text-sm outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="">— No project —</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </label>
          <div className="flex items-center gap-2 min-w-0">
            <User className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
            <span className="label-mono shrink-0">Client</span>
            <div className="flex-1 min-w-0 text-sm font-mono px-2 py-1.5 truncate text-muted-foreground">
              {client ? client.name : project ? "— project has no client —" : "— assign a project first —"}
            </div>
          </div>
        </div>

        <div className="mb-6">
          <SessionMeta session={session} />
        </div>

        {session.type === "recording" ? (
          <div className="grid lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <InputList session={session} />
              <TakeLog session={session} />
            </div>
            <div className="space-y-6">
              <Notes session={session} />
              <TapTempo />
            </div>
          </div>
        ) : session.type === "mix" ? (
          <div className="grid lg:grid-cols-3 gap-6">
            <div className="space-y-6">
              <MixChecklist session={session} />
              <TapTempo />
            </div>
            <div className="lg:col-span-2 space-y-6">
              <Revisions session={session} />
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
              <TapTempo />
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
};

export default SessionView;
