import { useState } from "react";
import { Plus, Trash2, Share2, Copy, Check, X, MessageSquare } from "lucide-react";
import { useSession, helpers } from "@/lib/store/sessions";
import { useSessionShares } from "@/lib/store/shares";
import type { Session, RevisionStatus } from "@/lib/types";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const statusColors: Record<RevisionStatus, string> = {
  draft: "bg-surface-3 text-muted-foreground border-border",
  sent: "bg-info/20 text-info border-info/30",
  approved: "bg-success/20 text-success border-success/30",
  revise: "bg-primary/20 text-primary border-primary/30",
};

export function Revisions({ session }: { session: Session }) {
  const { update } = useSession(session.id);
  const revs = session.revisions ?? [];
  const { shares, feedback, createShare, toggleShare, removeShare } = useSessionShares(session.id);
  const [shareOpen, setShareOpen] = useState(false);
  const activeShare = shares.find((s) => s.active);

  const setRevs = (fn: (r: typeof revs) => typeof revs) =>
    update(session.id, (s) => ({ ...s, revisions: fn(s.revisions ?? []) }));

  const addRev = () => {
    const v = `v${revs.length + 1}`;
    setRevs((arr) => [helpers.newRevision(v), ...arr]);
  };

  const shareUrl = (token: string) => `${window.location.origin}/share/${encodeURIComponent(token)}`;

  const handleShare = async () => {
    try {
      let s = activeShare;
      if (!s) s = await createShare();
      const url = shareUrl(s.token);
      await navigator.clipboard.writeText(url);
      toast.success("Share link copied to clipboard");
      setShareOpen(true);
    } catch (e: any) {
      toast.error(e.message ?? "Could not create share");
    }
  };

  const copyLink = async (token: string) => {
    await navigator.clipboard.writeText(shareUrl(token));
    toast.success("Copied");
  };

  return (
    <div className="panel">
      <div className="px-4 py-3 border-b border-border flex items-center justify-between">
        <div>
          <div className="font-display font-semibold">Revisions</div>
          <div className="label-mono mt-0.5">Client feedback log</div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShareOpen((v) => !v)}
            className={cn(
              "flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-sm border transition",
              activeShare
                ? "border-success/40 text-success bg-success/10"
                : "border-border text-muted-foreground hover:bg-surface-2",
            )}
            title="Share with client"
          >
            <Share2 className="h-3.5 w-3.5" /> Share
          </button>
          <button onClick={addRev} className="flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-sm bg-gradient-amber text-primary-foreground font-semibold">
            <Plus className="h-3.5 w-3.5" /> Revision
          </button>
        </div>
      </div>

      {shareOpen && (
        <div className="px-4 py-3 border-b border-border bg-surface-2/40 space-y-3">
          <div className="flex items-center gap-2">
            <button
              onClick={handleShare}
              className="flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-sm bg-gradient-amber text-primary-foreground font-semibold"
            >
              <Share2 className="h-3.5 w-3.5" />
              {activeShare ? "Copy share link" : "Create share link"}
            </button>
            {activeShare && (
              <span className="label-mono">Anyone with the link can review &amp; respond</span>
            )}
          </div>

          {shares.length > 0 && (
            <div className="space-y-1.5">
              {shares.map((s) => (
                <div key={s.id} className="flex items-center gap-2 text-xs bg-surface-1 border border-border rounded-sm px-2 py-1.5">
                  <span
                    className={cn(
                      "h-1.5 w-1.5 rounded-full shrink-0",
                      s.active ? "bg-success animate-pulse" : "bg-muted-foreground/40",
                    )}
                  />
                  <code className="font-mono text-[11px] text-muted-foreground truncate flex-1">
                    /share/{s.token}
                  </code>
                  <button
                    onClick={() => copyLink(s.token)}
                    className="text-muted-foreground hover:text-foreground p-1"
                    title="Copy link"
                  >
                    <Copy className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => toggleShare(s.id, !s.active)}
                    className="text-muted-foreground hover:text-foreground p-1"
                    title={s.active ? "Disable" : "Enable"}
                  >
                    {s.active ? <X className="h-3.5 w-3.5" /> : <Check className="h-3.5 w-3.5" />}
                  </button>
                  <button
                    onClick={() => removeShare(s.id)}
                    className="text-muted-foreground hover:text-destructive p-1"
                    title="Delete"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="divide-y divide-border/60 max-h-[600px] overflow-auto">
        {revs.map((r) => {
          const fbs = feedback.filter((f) => f.revision_id === r.id);
          return (
          <div key={r.id} className="p-4 group hover:bg-surface-2/40">
            <div className="flex items-center gap-3 mb-2">
              <input value={r.version} onChange={(e) => setRevs((a) => a.map((x) => x.id === r.id ? { ...x, version: e.target.value } : x))}
                className="w-16 font-mono text-lg font-bold text-primary bg-transparent outline-none focus:bg-surface-2 rounded-sm px-1" />
              <span className="text-xs text-muted-foreground font-mono">
                {new Date(r.date).toLocaleDateString()}
              </span>
              <div className="ml-auto flex items-center gap-1">
                {(["draft", "sent", "revise", "approved"] as RevisionStatus[]).map((st) => (
                  <button key={st} onClick={() => setRevs((a) => a.map((x) => x.id === r.id ? { ...x, status: st } : x))}
                    className={cn(
                      "text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-sm border transition",
                      r.status === st ? statusColors[st] : "border-transparent text-muted-foreground hover:bg-surface-2"
                    )}>{st}</button>
                ))}
                <button onClick={() => setRevs((a) => a.filter((x) => x.id !== r.id))}
                  className="text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 p-1 ml-1">
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
            <div className="grid md:grid-cols-2 gap-3">
              <div>
                <div className="label-mono mb-1">Client feedback</div>
                <textarea value={r.feedback} onChange={(e) => setRevs((a) => a.map((x) => x.id === r.id ? { ...x, feedback: e.target.value } : x))}
                  rows={3} placeholder="Vocal too loud..."
                  className="w-full bg-input border border-border rounded-sm p-2 text-sm outline-none focus:ring-1 focus:ring-primary resize-none" />
              </div>
              <div>
                <div className="label-mono mb-1">Changes made</div>
                <textarea value={r.changes} onChange={(e) => setRevs((a) => a.map((x) => x.id === r.id ? { ...x, changes: e.target.value } : x))}
                  rows={3} placeholder="-2 dB lead vox..."
                  className="w-full bg-input border border-border rounded-sm p-2 text-sm outline-none focus:ring-1 focus:ring-primary resize-none" />
              </div>
            </div>
            {fbs.length > 0 && (
              <div className="mt-3 space-y-2">
                <div className="label-mono flex items-center gap-1.5">
                  <MessageSquare className="h-3 w-3" /> Client responses
                </div>
                {fbs.map((fb) => (
                  <div key={fb.id} className="bg-surface-2/60 border border-border rounded-sm p-2.5">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-semibold">{fb.client_name || "Anonymous"}</span>
                      <span
                        className={cn(
                          "text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded-sm border",
                          fb.decision === "approved" && "bg-success/20 text-success border-success/30",
                          fb.decision === "revise" && "bg-primary/20 text-primary border-primary/30",
                          fb.decision === "pending" && "bg-surface-3 text-muted-foreground border-border",
                        )}
                      >
                        {fb.decision}
                      </span>
                      <span className="ml-auto text-[10px] font-mono text-muted-foreground">
                        {new Date(fb.updated_at).toLocaleString()}
                      </span>
                    </div>
                    {fb.feedback && (
                      <p className="text-xs text-muted-foreground whitespace-pre-wrap">{fb.feedback}</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
          );
        })}
        {revs.length === 0 && <div className="p-8 text-center text-muted-foreground text-sm">No revisions logged.</div>}
      </div>
    </div>
  );
}
