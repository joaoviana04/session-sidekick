import { useEffect, useState, useCallback } from "react";
import { useParams } from "react-router-dom";
import { CheckCircle2, RefreshCw, Loader2, Mic, Sliders } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import sessionsLogo from "@/assets/sessions-logo.png";
import type { Revision } from "@/lib/types";

type Decision = "pending" | "approved" | "revise";

interface FeedbackRow {
  id: string;
  revision_id: string;
  client_name: string;
  feedback: string;
  decision: Decision;
  updated_at: string;
}

interface ShareData {
  share: { id: string; session_id: string };
  session: {
    id: string;
    title: string;
    artist: string;
    type: "recording" | "mix";
    revisions: Revision[];
  };
  feedback: FeedbackRow[];
}

const Share = () => {
  const { token } = useParams<{ token: string }>();
  const [data, setData] = useState<ShareData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [drafts, setDrafts] = useState<Record<string, { name: string; feedback: string }>>({});
  const [submitting, setSubmitting] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await supabase.functions.invoke<ShareData>(
        `share-revisions?token=${encodeURIComponent(token)}`,
        { method: "GET" },
      );
      if (res.error) throw res.error;
      const payload = res.data;
      if (!payload) throw new Error("No data");
      setData(payload);
      // Hydrate drafts from existing feedback
      const next: Record<string, { name: string; feedback: string }> = {};
      for (const fb of payload.feedback) {
        next[fb.revision_id] = { name: fb.client_name, feedback: fb.feedback };
      }
      setDrafts(next);
    } catch (e: any) {
      setError(e.message ?? "Could not load share");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    load();
  }, [load]);

  const submit = async (revisionId: string, decision: Decision) => {
    if (!token || !data) return;
    const draft = drafts[revisionId] ?? { name: "", feedback: "" };
    setSubmitting(revisionId);
    try {
      const res = await supabase.functions.invoke(
        `share-revisions?token=${encodeURIComponent(token)}`,
        {
          method: "POST",
          body: {
            revision_id: revisionId,
            client_name: draft.name,
            feedback: draft.feedback,
            decision,
          },
        },
      );
      if (res.error) throw res.error;
      toast.success(
        decision === "approved"
          ? "Marked as approved."
          : decision === "revise"
            ? "Revision requested."
            : "Feedback saved.",
      );
      await load();
    } catch (e: any) {
      toast.error(e.message ?? "Could not send feedback");
    } finally {
      setSubmitting(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen grid place-items-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen grid place-items-center px-6 text-center">
        <div className="panel p-10 max-w-md">
          <div className="font-display text-xl font-semibold mb-2">Link unavailable</div>
          <p className="text-sm text-muted-foreground">
            This share link is no longer active or doesn't exist.
          </p>
        </div>
      </div>
    );
  }

  const { session, feedback } = data;
  const Icon = session.type === "recording" ? Mic : Sliders;
  const fbByRev = new Map(feedback.map((f) => [f.revision_id, f]));

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-surface-1">
        <div className="max-w-3xl mx-auto px-6 py-4 flex items-center gap-3">
          <img src={sessionsLogo} alt="Sessions" width={32} height={32} className="h-8 w-8" />
          <div className="font-display font-semibold">Sessions</div>
          <div className="ml-auto label-mono">client review</div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-8">
        <div className="mb-8 flex items-center gap-3">
          <div className="h-10 w-10 rounded-sm bg-surface-2 grid place-items-center text-primary">
            <Icon className="h-5 w-5" />
          </div>
          <div>
            <div className="label-mono">{session.type === "recording" ? "tracking" : "mix"}</div>
            <h1 className="font-display text-2xl font-bold">{session.title}</h1>
            {session.artist && (
              <div className="text-sm text-muted-foreground">{session.artist}</div>
            )}
          </div>
        </div>

        {session.revisions.length === 0 ? (
          <div className="panel p-10 text-center text-muted-foreground text-sm">
            No revisions to review yet.
          </div>
        ) : (
          <div className="space-y-4">
            {session.revisions.map((r) => {
              const fb = fbByRev.get(r.id);
              const draft = drafts[r.id] ?? {
                name: fb?.client_name ?? "",
                feedback: fb?.feedback ?? "",
              };
              const updateDraft = (
                field: "name" | "feedback",
                value: string,
              ) => setDrafts((d) => ({ ...d, [r.id]: { ...draft, [field]: value } }));

              return (
                <div key={r.id} className="panel p-5">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="font-mono text-lg font-bold text-primary">{r.version}</div>
                    <div className="text-xs text-muted-foreground font-mono">
                      {new Date(r.date).toLocaleDateString()}
                    </div>
                    {fb && (
                      <span
                        className={cn(
                          "ml-auto text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-sm border",
                          fb.decision === "approved" && "bg-success/20 text-success border-success/30",
                          fb.decision === "revise" && "bg-primary/20 text-primary border-primary/30",
                          fb.decision === "pending" && "bg-surface-3 text-muted-foreground border-border",
                        )}
                      >
                        {fb.decision}
                      </span>
                    )}
                  </div>

                  {r.changes && (
                    <div className="mb-4">
                      <div className="label-mono mb-1">Engineer notes</div>
                      <div className="text-sm whitespace-pre-wrap text-muted-foreground bg-surface-2/50 rounded-sm p-3 border border-border">
                        {r.changes}
                      </div>
                    </div>
                  )}

                  <div className="space-y-3">
                    <label className="block">
                      <div className="label-mono mb-1">Your name (optional)</div>
                      <input
                        value={draft.name}
                        onChange={(e) => updateDraft("name", e.target.value)}
                        placeholder="e.g. Sarah"
                        className="w-full bg-input border border-border rounded-sm px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary"
                      />
                    </label>
                    <label className="block">
                      <div className="label-mono mb-1">Your feedback</div>
                      <textarea
                        value={draft.feedback}
                        onChange={(e) => updateDraft("feedback", e.target.value)}
                        rows={4}
                        placeholder="Share thoughts, requested changes, or approval notes…"
                        className="w-full bg-input border border-border rounded-sm p-3 text-sm outline-none focus:ring-1 focus:ring-primary resize-none"
                      />
                    </label>
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        disabled={submitting === r.id}
                        onClick={() => submit(r.id, "approved")}
                        className="flex items-center gap-1.5 rounded-sm bg-success/20 text-success border border-success/30 px-3 py-2 text-sm font-semibold hover:bg-success/30 transition disabled:opacity-50"
                      >
                        <CheckCircle2 className="h-4 w-4" /> Approve
                      </button>
                      <button
                        type="button"
                        disabled={submitting === r.id}
                        onClick={() => submit(r.id, "revise")}
                        className="flex items-center gap-1.5 rounded-sm bg-primary/20 text-primary border border-primary/30 px-3 py-2 text-sm font-semibold hover:bg-primary/30 transition disabled:opacity-50"
                      >
                        <RefreshCw className="h-4 w-4" /> Request revision
                      </button>
                      <button
                        type="button"
                        disabled={submitting === r.id}
                        onClick={() => submit(r.id, fb?.decision ?? "pending")}
                        className="ml-auto rounded-sm bg-surface-2 text-foreground border border-border px-3 py-2 text-sm hover:bg-surface-3 transition disabled:opacity-50"
                      >
                        Save without decision
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <footer className="mt-12 text-center text-xs text-muted-foreground">
          Powered by <span className="text-primary">Sessions</span>
        </footer>
      </main>
    </div>
  );
};

export default Share;