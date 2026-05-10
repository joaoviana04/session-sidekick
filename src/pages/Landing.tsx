import { Link, Navigate } from "react-router-dom";
import { Mic, Sliders, Zap, Headphones, Workflow, Clock, FileDown, Share2, ArrowRight } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import sessionsLogo from "@/assets/sessions-logo.png";

const FEATURES = [
  { Icon: Mic, title: "Tracking sessions", body: "Input lists, take logs, signal-flow visualizer and session notes — built for the control room." },
  { Icon: Sliders, title: "Mix sessions", body: "Checklists, references with LUFS targets, and revision tracking with shareable links for clients." },
  { Icon: Zap, title: "Live sessions", body: "Patch list, setlist, monitor mixes and a timestamped show log. Plus a fullscreen Show Mode for FOH." },
  { Icon: Workflow, title: "Signal flow", body: "Three views — cards, patchbay and grouped by instrument — to see your routing at a glance." },
  { Icon: Clock, title: "Session timer", body: "Persists across page changes, logs every work block. Export billable hours per project or client." },
  { Icon: FileDown, title: "PDF export", body: "Hand a clean session sheet to artists, producers or stage techs in one click." },
];

const Landing = () => {
  const { user, loading } = useAuth();
  if (!loading && user) return <Navigate to="/" replace />;

  return (
    <div className="min-h-screen flex flex-col">
      {/* Nav */}
      <header className="px-6 sm:px-10 py-5 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <img src={sessionsLogo} alt="Sessions" width={32} height={32} className="h-8 w-8" />
          <div className="font-display font-bold tracking-tight">Sessions</div>
        </div>
        <div className="flex items-center gap-2">
          <Link to="/auth" className="text-xs sm:text-sm text-muted-foreground hover:text-foreground px-3 py-2">
            Sign in
          </Link>
          <Link
            to="/auth"
            className="text-xs sm:text-sm rounded-sm bg-gradient-amber text-primary-foreground px-3 sm:px-4 py-2 font-semibold hover:opacity-90 transition"
          >
            Get started
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="flex-1 grid place-items-center px-6 sm:px-10 py-12 sm:py-20">
        <div className="max-w-3xl text-center">
          <div className="label-mono mb-4 inline-flex items-center gap-1.5">
            <span className="led animate-pulse-led" /> studio companion · v1
          </div>
          <h1 className="font-display font-bold text-4xl sm:text-6xl lg:text-7xl tracking-tight leading-[0.95]">
            Run the studio.<br />
            <span className="bg-gradient-amber bg-clip-text text-transparent">Not the paperwork.</span>
          </h1>
          <p className="mt-6 text-base sm:text-lg text-muted-foreground max-w-xl mx-auto">
            Sessions is the operating layer for tracking, mix and live engineers — input lists, take logs,
            revisions, monitor mixes and a fullscreen Show Mode. All synced, all yours.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link
              to="/auth"
              className="inline-flex items-center gap-2 rounded-sm bg-gradient-amber text-primary-foreground px-5 py-3 text-sm font-semibold hover:opacity-90 transition"
            >
              Start a session <ArrowRight className="h-4 w-4" />
            </Link>
            <a
              href="#features"
              className="inline-flex items-center gap-2 rounded-sm bg-surface-2 hover:bg-surface-3 px-5 py-3 text-sm transition"
            >
              See what's inside
            </a>
          </div>

          {/* mock console strip */}
          <div className="mt-14 panel p-4 sm:p-5 text-left">
            <div className="flex items-center gap-2 mb-3">
              <span className="led" /> <span className="led-off" /> <span className="led-off" />
              <div className="label-mono ml-auto">SESSION · LIVE</div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 text-xs font-mono">
              {[
                ["CH 01", "Kick In"],
                ["CH 02", "Kick Out"],
                ["CH 03", "Snare T"],
                ["CH 04", "Snare B"],
                ["CH 05", "HH"],
                ["CH 06", "Tom 1"],
                ["CH 07", "OH L"],
                ["CH 08", "OH R"],
              ].map(([ch, src]) => (
                <div key={ch} className="bg-surface-2 rounded-sm px-2.5 py-2 flex items-center justify-between">
                  <span className="text-primary">{ch}</span>
                  <span className="text-muted-foreground truncate">{src}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="px-6 sm:px-10 py-16 sm:py-24 border-t border-border">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <div className="label-mono mb-3">what's inside</div>
            <h2 className="font-display font-bold text-3xl sm:text-4xl">Everything an engineer needs.</h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {FEATURES.map(({ Icon, title, body }) => (
              <div key={title} className="panel p-5">
                <div className="h-9 w-9 rounded-sm bg-surface-2 grid place-items-center text-primary mb-3">
                  <Icon className="h-4 w-4" />
                </div>
                <div className="font-display font-semibold mb-1">{title}</div>
                <p className="text-sm text-muted-foreground leading-relaxed">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Use cases */}
      <section className="px-6 sm:px-10 py-16 sm:py-20 border-t border-border bg-surface-1/50">
        <div className="max-w-5xl mx-auto grid sm:grid-cols-3 gap-6 text-center">
          {[
            { Icon: Headphones, label: "Tracking engineers", body: "Never lose a take. Document the chain, mark keepers, hand off clean." },
            { Icon: Sliders, label: "Mixing engineers", body: "Checklists per session, reference targets, client-shareable revisions." },
            { Icon: Share2, label: "Live & FOH", body: "Patch, setlist, monitors and a fullscreen Show Mode for the gig." },
          ].map(({ Icon, label, body }) => (
            <div key={label}>
              <div className="h-10 w-10 mx-auto mb-3 rounded-sm bg-surface-2 grid place-items-center text-primary">
                <Icon className="h-4 w-4" />
              </div>
              <div className="font-display font-semibold mb-1">{label}</div>
              <p className="text-sm text-muted-foreground">{body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="px-6 sm:px-10 py-20 text-center">
        <h3 className="font-display font-bold text-3xl sm:text-4xl mb-4">
          Ready to start your next session?
        </h3>
        <p className="text-muted-foreground mb-6">Free while in beta. No credit card.</p>
        <Link
          to="/auth"
          className="inline-flex items-center gap-2 rounded-sm bg-gradient-amber text-primary-foreground px-6 py-3 text-sm font-semibold hover:opacity-90 transition"
        >
          Create your account <ArrowRight className="h-4 w-4" />
        </Link>
      </section>

      <footer className="px-6 sm:px-10 py-6 border-t border-border text-xs text-muted-foreground flex items-center justify-between">
        <div>© {new Date().getFullYear()} Sessions</div>
        <div className="font-mono">studio companion</div>
      </footer>
    </div>
  );
};

export default Landing;