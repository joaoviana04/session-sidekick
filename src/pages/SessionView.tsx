import { useParams, Link } from "react-router-dom";
import { ArrowLeft, Mic, Sliders } from "lucide-react";
import { AppShell } from "@/components/console/AppShell";
import { useSessions } from "@/lib/store/sessions";
import { SessionTimer } from "@/components/console/SessionTimer";
import { SessionMeta } from "@/components/console/SessionMeta";
import { InputList } from "@/components/console/InputList";
import { TakeLog } from "@/components/console/TakeLog";
import { Notes } from "@/components/console/Notes";
import { MixChecklist } from "@/components/console/MixChecklist";
import { References } from "@/components/console/References";
import { Revisions } from "@/components/console/Revisions";
import { TapTempo } from "@/components/console/TapTempo";

const SessionView = () => {
  const { id } = useParams<{ id: string }>();
  const { sessions, update } = useSessions();
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

  const Icon = session.type === "recording" ? Mic : Sliders;
  const accent = session.type === "recording" ? "text-info" : "text-primary";

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
            <div className="label-mono">{session.type === "recording" ? "tracking session" : "mix session"}</div>
            <input value={session.title}
              onChange={(e) => update(session.id, { title: e.target.value })}
              className="font-display text-2xl md:text-3xl font-bold bg-transparent outline-none focus:bg-surface-2 rounded-sm px-1 -ml-1 w-full" />
            <input value={session.artist}
              onChange={(e) => update(session.id, { artist: e.target.value })}
              className="block text-base md:text-sm text-muted-foreground bg-transparent outline-none focus:bg-surface-2 rounded-sm px-1 -ml-1 mt-1 w-full" />
          </div>
          <div className="w-full sm:w-auto sm:min-w-[240px]">
            <SessionTimer />
          </div>
        </header>

        <div className="mb-6">
          <SessionMeta session={session} />
        </div>

        {session.type === "recording" ? (
          <div className="grid lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <InputList session={session} />
              <Notes session={session} />
            </div>
            <div className="space-y-6">
              <TakeLog session={session} />
              <TapTempo />
            </div>
          </div>
        ) : (
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
        )}
      </div>
    </AppShell>
  );
};

export default SessionView;
