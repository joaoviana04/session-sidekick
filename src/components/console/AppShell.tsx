import { ReactNode, useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Mic, Sliders, Wrench, Radio, Plus, FolderKanban, Users, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";
import { useSessions } from "@/lib/store/sessions";
import { NewSessionDialog } from "./NewSessionDialog";
import { useAuth } from "@/hooks/useAuth";
import sessionsLogo from "@/assets/sessions-logo.png";

export function AppShell({ children }: { children: ReactNode }) {
  const location = useLocation();
  const { sessions } = useSessions();
  const { user, signOut } = useAuth();
  const [open, setOpen] = useState(false);
  const [time, setTime] = useState(() => new Date());

  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const nav = [
    { to: "/", label: "Sessions", icon: Radio },
    { to: "/projects", label: "Projects", icon: FolderKanban },
    { to: "/clients", label: "Clients", icon: Users },
    { to: "/tools", label: "Tools", icon: Wrench },
  ];

  return (
    <div className="min-h-screen flex w-full bg-background text-foreground">
      {/* Sidebar */}
      <aside className="hidden md:flex w-64 shrink-0 flex-col border-r border-border bg-surface-1">
        <div className="px-5 py-5 border-b border-border flex items-center gap-3">
          <img src={sessionsLogo} alt="Sessions" width={32} height={32} className="h-8 w-8" />
          <div>
            <div className="font-display font-semibold leading-none">Sessions</div>
            <div className="label-mono mt-1">studio companion</div>
          </div>
        </div>

        <nav className="p-3 space-y-1">
          {nav.map((n) => {
            const active = location.pathname === n.to || (n.to === "/" && location.pathname.startsWith("/session"));
            return (
              <Link key={n.to} to={n.to}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-sm text-sm transition-colors",
                  active ? "bg-surface-2 text-foreground" : "text-muted-foreground hover:bg-surface-2 hover:text-foreground"
                )}>
                <n.icon className="h-4 w-4" />
                {n.label}
              </Link>
            );
          })}
        </nav>

        <div className="px-3 mt-2">
          <button onClick={() => setOpen(true)}
            className="w-full flex items-center justify-center gap-2 rounded-sm bg-gradient-amber text-primary-foreground px-3 py-2 text-sm font-semibold hover:opacity-90 transition">
            <Plus className="h-4 w-4" /> New session
          </button>
        </div>

        <div className="px-3 mt-6">
          <div className="label-mono px-2 mb-2">Recent</div>
          <div className="space-y-1 max-h-[40vh] overflow-auto pr-1">
            {sessions.slice(0, 12).map((s) => {
              const Icon = s.type === "recording" ? Mic : Sliders;
              const active = location.pathname === `/session/${s.id}`;
              return (
                <Link key={s.id} to={`/session/${s.id}`}
                  className={cn(
                    "flex items-center gap-2 px-2 py-1.5 rounded-sm text-xs group",
                    active ? "bg-surface-2 text-foreground" : "text-muted-foreground hover:bg-surface-2 hover:text-foreground"
                  )}>
                  <Icon className={cn("h-3.5 w-3.5 shrink-0", s.type === "recording" ? "text-info" : "text-primary")} />
                  <span className="truncate flex-1">{s.title}</span>
                </Link>
              );
            })}
            {sessions.length === 0 && (
              <div className="px-2 py-3 text-xs text-muted-foreground/70 italic">No sessions yet.</div>
            )}
          </div>
        </div>

        <div className="mt-auto p-4 border-t border-border">
          {user && (
            <div className="flex items-center gap-2 mb-3 text-xs">
              <div className="h-7 w-7 rounded-full bg-surface-2 grid place-items-center font-mono text-[10px] text-muted-foreground shrink-0">
                {user.email?.[0]?.toUpperCase() ?? "?"}
              </div>
              <span className="truncate flex-1 text-muted-foreground">{user.email}</span>
              <button onClick={signOut} title="Sign out"
                className="text-muted-foreground hover:text-destructive transition">
                <LogOut className="h-3.5 w-3.5" />
              </button>
            </div>
          )}
          <div className="flex items-center gap-2">
            <span className="led animate-pulse-led" />
            <span className="label-mono">live</span>
            <span className="ml-auto font-mono text-xs text-muted-foreground">
              {time.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false })}
            </span>
          </div>
        </div>
      </aside>

      {/* Mobile top bar */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-40 bg-surface-1 border-b border-border flex items-center px-4 py-3">
        <img src={sessionsLogo} alt="Sessions" width={28} height={28} className="h-7 w-7 mr-2" />
        <span className="font-display font-semibold">Sessions</span>
        <button onClick={() => setOpen(true)} className="ml-auto rounded-sm bg-gradient-amber text-primary-foreground p-1.5">
          <Plus className="h-4 w-4" />
        </button>
      </div>

      <main className="flex-1 min-w-0 md:pt-0 pt-14">
        {children}
      </main>

      <NewSessionDialog open={open} onOpenChange={setOpen} />
    </div>
  );
}