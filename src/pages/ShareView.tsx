import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Sliders } from "lucide-react";
import { cn } from "@/lib/utils";
import type { RevisionStatus } from "@/lib/types";

interface SharedRevision {
  id: string;
  version: string;
  date: string;
  status: RevisionStatus;
  feedback: string;
  changes: string;
}

interface SharedSession {
  id: string;
  title: string;
  artist: string;
  type: string;
  revisions: SharedRevision[];
  created_at: string;
}

const statusColors: Record<RevisionStatus, string> = {
  draft: "bg-surface-3 text-muted-foreground border-border",
  sent: "bg-info/20 text-info border-info/30",
  approved: "bg-success/20 text-success border-success/30",
  revise: "bg-primary/20 text-primary border-primary/30",
};

const ShareView = () => {
  const { token } = useParams<{ token: string }>();
  const [session, setSession] = useState<SharedSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!token) { setNotFound(true); setLoading(false); return; }
    supabase
      .rpc("get_shared_session", { p_token: token })
      .then(({ data, error }) => {
        if (error || !data) { setNotFound(true); }
        else {
          const raw = data as any;
          setSession({
            ...raw,
            revisions: (raw.revisions ?? []) as SharedRevision[],
          });
        }
        setLoading(false);
      });
  }, [token]);

  if (loading) {
    return (
      <div className="min-h-screen grid place-items-center">
        <div className="label-mono text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (notFound || !session) {
    return (
      <div className="min-h-screen grid place-items-center px-6">
        <div className="max-w-sm w-full panel p-8 text-center">
          <div className="label-mono mb-4">// share link</div>
          <h1 className="font-display text-xl font-bold mb-3">Link not found</h1>
          <p className="text-muted-foreground text-sm">
            This link may have expired or been revoked by the studio engineer.
          </p>
        </div>
      </div>
    );
  }

  const revisions = session.revisions ?? [];

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="max-w-2xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="flex items-center gap-3 mb-10">
          <div className="h-10 w-10 rounded-sm bg-gradient-amber grid place-items-center flex-shrink-0">
            <Sliders className="h-5 w-5 text-primary-foreground" />
          </div>
          <div>
            <div className="label-mono">mix session</div>
            <h1 className="font-display text-2xl font-bold leading-tight">{session.title}</h1>
            {session.artist && (
              <div className="text-sm text-muted-foreground mt-0.5">{session.artist}</div>
            )}
          </div>
        </div>

        {/* Revisions */}
        <div className="panel">
          <div className="px-4 py-3 border-b border-border">
            <div className="font-display font-semibold">Revisions</div>
            <div className="label-mono mt-0.5">{revisions.length} revision{revisions.length !== 1 ? "s" : ""}</div>
          </div>

          <div className="divide-y divide-border/60">
            {revisions.map((r) => (
              <div key={r.id} className="p-4">
                <div className="flex items-center gap-3 mb-3">
                  <span className="font-mono text-lg font-bold text-primary">{r.version}</span>
                  <span className="text-xs text-muted-foreground font-mono">
                    {new Date(r.date).toLocaleDateString()}
                  </span>
                  <span className={cn(
                    "ml-auto text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-sm border",
                    statusColors[r.status]
                  )}>
                    {r.status}
                  </span>
                </div>
                {(r.feedback || r.changes) && (
                  <div className="grid md:grid-cols-2 gap-3">
                    {r.feedback && (
                      <div>
                        <div className="label-mono mb-1">Feedback</div>
                        <p className="text-sm text-muted-foreground whitespace-pre-wrap">{r.feedback}</p>
                      </div>
                    )}
                    {r.changes && (
                      <div>
                        <div className="label-mono mb-1">Changes made</div>
                        <p className="text-sm text-muted-foreground whitespace-pre-wrap">{r.changes}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
            {revisions.length === 0 && (
              <div className="p-8 text-center text-muted-foreground text-sm">No revisions yet.</div>
            )}
          </div>
        </div>

        <p className="text-xs text-muted-foreground text-center mt-6">
          Shared via Console — studio session companion
        </p>
      </div>
    </div>
  );
};

export default ShareView;
