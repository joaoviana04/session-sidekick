import { ReactNode, memo, useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Mic, Sliders, Wrench, Radio, Plus, FolderKanban, Users, LogOut, Menu, X, Zap, User2, PenLine, Receipt, CalendarDays } from "lucide-react";
import { cn } from "@/lib/utils";
import { useSessions } from "@/lib/store/sessions";
import { NewSessionDialog } from "./NewSessionDialog";
import { useAuth } from "@/hooks/useAuth";
import { Logo } from "@/components/Logo";

const LiveClock = memo(function LiveClock() {
  const [time, setTime] = useState(() => new Date());
  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);
  return (
    <span className="ml-auto font-mono text-xs text-muted-foreground tabular-nums">
      {time.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false })}
    </span>
  );
});

const sessionIconMeta = (type: string) =>
  type === "recording"
    ? { Icon: Mic, accent: "text-info", bg: "bg-info/10" }
    : type === "mix"
    ? { Icon: Sliders, accent: "text-primary", bg: "bg-primary/10" }
    : type === "compose"
    ? { Icon: PenLine, accent: "text-accent", bg: "bg-accent/10" }
    : { Icon: Zap, accent: "text-success", bg: "bg-success/10" };

function NavLinks({ nav, location, onNavigate }: { nav: { to: string; label: string; icon: any }[]; location: ReturnType<typeof useLocation>; onNavigate?: () => void }) {
  return (
    <nav className="px-3 space-y-1">
      {nav.map((n) => {
        const active = location.pathname === n.to || (n.to === "/" && location.pathname.startsWith("/session"));
        return (
          <Link
            key={n.to}
            to={n.to}
            onClick={onNavigate}
            className={cn(
              "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
              active
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:bg-surface-2 hover:text-foreground",
            )}
          >
            <n.icon className="h-4 w-4 shrink-0" strokeWidth={2} />
            {n.label}
          </Link>
        );
      })}
    </nav>
  );
}

function RecentSessions({ sessions, location, limit, className }: { sessions: ReturnType<typeof useSessions>["sessions"]; location: ReturnType<typeof useLocation>; limit: number; className?: string }) {
  return (
    <div className={cn("px-3", className)}>
      <div className="label-mono px-2 mb-2">Recent</div>
      <div className="space-y-0.5 pr-1">
        {sessions.slice(0, limit).map((s) => {
          const { Icon, accent, bg } = sessionIconMeta(s.type);
          const active = location.pathname === `/session/${s.id}`;
          return (
            <Link
              key={s.id}
              to={`/session/${s.id}`}
              className={cn(
                "flex items-center gap-2.5 px-2 py-1.5 rounded-lg text-xs transition-colors",
                active ? "bg-surface-2 text-foreground" : "text-muted-foreground hover:bg-surface-2 hover:text-foreground",
              )}
            >
              <span className={cn("h-5 w-5 rounded-md grid place-items-center shrink-0", bg)}>
                <Icon className={cn("h-3 w-3", accent)} strokeWidth={2} />
              </span>
              <span className="truncate flex-1">{s.title}</span>
            </Link>
          );
        })}
        {sessions.length === 0 && (
          <div className="px-2 py-3 text-xs text-muted-foreground/70 italic">No sessions yet.</div>
        )}
      </div>
    </div>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const location = useLocation();
  const { sessions } = useSessions();
  const { user, signOut } = useAuth();
  const [open, setOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  // Close mobile menu on route change
  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  const nav = [
    { to: "/", label: "Sessions", icon: Radio },
    { to: "/projects", label: "Projects", icon: FolderKanban },
    { to: "/clients", label: "Clients", icon: Users },
    { to: "/invoices", label: "Invoices", icon: Receipt },
    { to: "/calendar", label: "Calendar", icon: CalendarDays },
    { to: "/tools", label: "Tools", icon: Wrench },
    { to: "/profile", label: "Profile", icon: User2 },
  ];

  return (
    <div className="min-h-screen flex w-full bg-background text-foreground">
      {/* Sidebar */}
      <aside className="hidden md:flex w-64 shrink-0 flex-col border-r border-border bg-surface-1">
        <div className="px-5 py-5 flex items-center gap-3">
          <Logo className="h-9 w-9" />
          <div>
            <div className="font-display font-semibold leading-none text-[15px]">Sessions</div>
            <div className="label-mono mt-1.5">studio companion</div>
          </div>
        </div>

        <div className="px-3 mb-4">
          <button onClick={() => setOpen(true)}
            className="w-full flex items-center justify-center gap-2 rounded-lg bg-gradient-amber text-primary-foreground px-3 py-2.5 text-sm font-semibold hover:opacity-90 transition shadow-led">
            <Plus className="h-4 w-4" strokeWidth={2.5} /> New session
          </button>
        </div>

        <NavLinks nav={nav} location={location} />

        <RecentSessions sessions={sessions} location={location} limit={12} className="mt-6 flex-1 min-h-0 overflow-auto" />

        <div className="mt-auto p-3 pt-4 border-t border-border/70">
          {user && (
            <div className="flex items-center gap-2 mb-3 px-1 text-xs">
              <Link to="/profile" className="flex items-center gap-2.5 flex-1 min-w-0 hover:text-foreground transition">
                <div className="h-7 w-7 rounded-full bg-surface-2 grid place-items-center font-mono text-[10px] text-muted-foreground shrink-0">
                  {user.email?.[0]?.toUpperCase() ?? "?"}
                </div>
                <span className="truncate text-muted-foreground">{user.email}</span>
              </Link>
              <button onClick={signOut} title="Sign out"
                className="text-muted-foreground hover:text-destructive transition p-1 -m-1">
                <LogOut className="h-3.5 w-3.5" />
              </button>
            </div>
          )}
          <div className="flex items-center gap-2 px-1">
            <span className="led animate-pulse-led" />
            <span className="label-mono">live</span>
            <LiveClock />
          </div>
        </div>
      </aside>

      {/* Mobile top bar */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-40 bg-surface-1/95 backdrop-blur border-b border-border flex items-center px-4 h-14 gap-3">
        <button
          onClick={() => setMenuOpen(true)}
          className="p-1.5 -ml-1.5 rounded-lg hover:bg-surface-2 transition"
          aria-label="Open menu"
        >
          <Menu className="h-5 w-5" />
        </button>
        <Logo className="h-7 w-7" />
        <span className="font-display font-semibold text-[15px]">Sessions</span>
        <button
          onClick={() => setOpen(true)}
          className="ml-auto rounded-lg bg-gradient-amber text-primary-foreground p-2 shadow-led"
          aria-label="New session"
        >
          <Plus className="h-4 w-4" strokeWidth={2.5} />
        </button>
      </div>

      {/* Mobile drawer menu */}
      {menuOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div
            className="absolute inset-0 bg-black/60 animate-fade-in"
            onClick={() => setMenuOpen(false)}
          />
          <aside className="relative w-72 max-w-[85vw] bg-surface-1 border-r border-border flex flex-col animate-fade-in">
            <div className="px-5 py-4 border-b border-border/70 flex items-center gap-3">
              <Logo className="h-9 w-9" />
              <div className="flex-1">
                <div className="font-display font-semibold leading-none text-[15px]">Sessions</div>
                <div className="label-mono mt-1.5">studio companion</div>
              </div>
              <button
                onClick={() => setMenuOpen(false)}
                className="p-1.5 rounded-lg hover:bg-surface-2 transition"
                aria-label="Close menu"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="px-3 mt-4 mb-4">
              <button
                onClick={() => { setMenuOpen(false); setOpen(true); }}
                className="w-full flex items-center justify-center gap-2 rounded-lg bg-gradient-amber text-primary-foreground px-3 py-2.5 text-sm font-semibold shadow-led"
              >
                <Plus className="h-4 w-4" strokeWidth={2.5} /> New session
              </button>
            </div>

            <NavLinks nav={nav} location={location} onNavigate={() => setMenuOpen(false)} />

            <RecentSessions sessions={sessions} location={location} limit={20} className="mt-6 flex-1 min-h-0 overflow-auto" />

            <div className="p-3 pt-4 border-t border-border/70">
              {user && (
                <div className="flex items-center gap-2 px-1 text-xs">
                  <Link to="/profile" className="flex items-center gap-2.5 flex-1 min-w-0 hover:text-foreground transition">
                    <div className="h-7 w-7 rounded-full bg-surface-2 grid place-items-center font-mono text-[10px] text-muted-foreground shrink-0">
                      {user.email?.[0]?.toUpperCase() ?? "?"}
                    </div>
                    <span className="truncate text-muted-foreground">{user.email}</span>
                  </Link>
                  <button
                    onClick={signOut}
                    title="Sign out"
                    className="text-muted-foreground hover:text-destructive transition p-1"
                  >
                    <LogOut className="h-4 w-4" />
                  </button>
                </div>
              )}
            </div>
          </aside>
        </div>
      )}

      <main className="flex-1 min-w-0 max-w-full overflow-x-hidden md:pt-0 pt-14">
        {children}
      </main>

      <NewSessionDialog open={open} onOpenChange={setOpen} />
    </div>
  );
}
