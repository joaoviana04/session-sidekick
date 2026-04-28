import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { Mic } from "lucide-react";

const Auth = () => {
  const { user, loading } = useAuth();
  const nav = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!loading && user) nav("/", { replace: true });
  }, [user, loading, nav]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email, password,
          options: {
            emailRedirectTo: `${window.location.origin}/`,
            data: { display_name: name || email.split("@")[0] },
          },
        });
        if (error) throw error;
        toast.success("Account created. Check your email to confirm.");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success("Welcome back.");
      }
    } catch (err: any) {
      toast.error(err.message ?? "Something went wrong.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen grid place-items-center px-6 py-10">
      <div className="w-full max-w-sm">
        <div className="flex items-center gap-3 mb-8">
          <div className="h-10 w-10 rounded-sm bg-gradient-amber grid place-items-center">
            <Mic className="h-5 w-5 text-primary-foreground" />
          </div>
          <div>
            <div className="font-display font-bold text-xl leading-none">Console</div>
            <div className="label-mono mt-1">studio companion</div>
          </div>
        </div>

        <div className="panel p-6">
          <div className="flex gap-1 mb-6 p-1 bg-surface-2 rounded-sm">
            {(["signin", "signup"] as const).map((m) => (
              <button key={m} type="button" onClick={() => setMode(m)}
                className={`flex-1 py-1.5 text-xs uppercase tracking-wider rounded-sm transition ${
                  mode === m ? "bg-background text-foreground" : "text-muted-foreground"
                }`}>
                {m === "signin" ? "Sign in" : "Sign up"}
              </button>
            ))}
          </div>

          <form onSubmit={submit} className="space-y-3">
            {mode === "signup" && (
              <label className="block">
                <div className="label-mono mb-1">Display name</div>
                <input value={name} onChange={(e) => setName(e.target.value)}
                  placeholder="Your name"
                  className="w-full bg-input border border-border rounded-sm px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary" />
              </label>
            )}
            <label className="block">
              <div className="label-mono mb-1">Email</div>
              <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-input border border-border rounded-sm px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary" />
            </label>
            <label className="block">
              <div className="label-mono mb-1">Password</div>
              <input type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-input border border-border rounded-sm px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary" />
            </label>
            <button type="submit" disabled={busy}
              className="w-full rounded-sm bg-gradient-amber text-primary-foreground py-2.5 font-semibold hover:opacity-90 transition disabled:opacity-50">
              {busy ? "..." : mode === "signin" ? "Sign in →" : "Create account →"}
            </button>
          </form>
        </div>

        <p className="text-xs text-muted-foreground text-center mt-4">
          Sessions, takes & notes — synced to the cloud, locked to your account.
        </p>
      </div>
    </div>
  );
};

export default Auth;
