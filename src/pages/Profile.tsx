import { AppShell } from "@/components/console/AppShell";
import { useAuth } from "@/hooks/useAuth";
import { useProfile, formatCurrency } from "@/lib/store/profile";
import { Link } from "react-router-dom";
import { ArrowLeft, User2, Wallet, Globe, LogOut } from "lucide-react";

const CURRENCIES = ["EUR", "USD", "GBP", "BRL", "JPY", "CHF", "CAD", "AUD", "DKK", "SEK", "NOK"];

export default function ProfilePage() {
  const { user, signOut } = useAuth();
  const { profile, loading, update } = useProfile();

  return (
    <AppShell>
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-10 py-6 sm:py-8">
        <Link to="/" className="text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1 mb-4">
          <ArrowLeft className="h-3.5 w-3.5" /> Back
        </Link>
        <header className="mb-6 flex items-center gap-4">
          <div className="h-14 w-14 rounded-sm bg-surface-2 grid place-items-center text-accent">
            <User2 className="h-6 w-6" />
          </div>
          <div>
            <div className="label-mono">profile</div>
            <h1 className="font-display text-2xl md:text-3xl font-bold">{profile.displayName || user?.email || "—"}</h1>
            <div className="text-xs text-muted-foreground">{user?.email}</div>
          </div>
        </header>

        {loading ? (
          <div className="panel p-6 text-sm text-muted-foreground">Loading…</div>
        ) : (
          <div className="space-y-6">
            <section className="panel p-4">
              <div className="flex items-center gap-2 mb-3">
                <User2 className="h-4 w-4 text-muted-foreground" />
                <h2 className="font-display font-semibold text-sm">Identity</h2>
              </div>
              <div className="grid sm:grid-cols-2 gap-3">
                <label className="block">
                  <div className="label-mono mb-1">Display name</div>
                  <input
                    value={profile.displayName}
                    onChange={(e) => update({ displayName: e.target.value })}
                    placeholder="Your name"
                    className="w-full bg-input border border-border rounded-sm px-2 py-1.5 text-sm outline-none focus:ring-1 focus:ring-primary"
                  />
                </label>
                <label className="block">
                  <div className="label-mono mb-1">Avatar URL</div>
                  <input
                    value={profile.avatarUrl}
                    onChange={(e) => update({ avatarUrl: e.target.value })}
                    placeholder="https://…"
                    className="w-full bg-input border border-border rounded-sm px-2 py-1.5 text-sm outline-none focus:ring-1 focus:ring-primary font-mono"
                  />
                </label>
                <label className="block sm:col-span-2">
                  <div className="label-mono mb-1">Bio</div>
                  <textarea
                    value={profile.bio}
                    onChange={(e) => update({ bio: e.target.value })}
                    placeholder="Short bio, role, studio…"
                    rows={3}
                    className="w-full bg-input border border-border rounded-sm px-2 py-1.5 text-sm outline-none focus:ring-1 focus:ring-primary resize-y"
                  />
                </label>
              </div>
            </section>

            <section className="panel p-4">
              <div className="flex items-center gap-2 mb-3">
                <Wallet className="h-4 w-4 text-muted-foreground" />
                <h2 className="font-display font-semibold text-sm">Billing</h2>
              </div>
              <div className="grid sm:grid-cols-2 gap-3">
                <label className="block">
                  <div className="label-mono mb-1">Hourly rate</div>
                  <input
                    type="number"
                    inputMode="decimal"
                    min={0}
                    step="0.01"
                    value={profile.hourlyRate ?? ""}
                    onChange={(e) => {
                      const v = e.target.value;
                      update({ hourlyRate: v === "" ? null : Number(v) });
                    }}
                    placeholder="50"
                    className="w-full bg-input border border-border rounded-sm px-2 py-1.5 text-sm outline-none focus:ring-1 focus:ring-primary font-mono tabular-nums"
                  />
                </label>
                <label className="block">
                  <div className="label-mono mb-1">Currency</div>
                  <select
                    value={profile.currency}
                    onChange={(e) => update({ currency: e.target.value })}
                    className="w-full bg-input border border-border rounded-sm px-2 py-1.5 text-sm outline-none focus:ring-1 focus:ring-primary font-mono"
                  >
                    {CURRENCIES.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </label>
              </div>
              {profile.hourlyRate != null && profile.hourlyRate > 0 && (
                <div className="mt-3 text-xs text-muted-foreground font-mono">
                  Example: 2h 30m → {formatCurrency(profile.hourlyRate * 2.5, profile.currency, profile.locale)}
                </div>
              )}
            </section>

            <section className="panel p-4">
              <div className="flex items-center gap-2 mb-3">
                <Globe className="h-4 w-4 text-muted-foreground" />
                <h2 className="font-display font-semibold text-sm">Locale</h2>
              </div>
              <div className="grid sm:grid-cols-2 gap-3">
                <label className="block">
                  <div className="label-mono mb-1">Locale</div>
                  <input
                    value={profile.locale}
                    onChange={(e) => update({ locale: e.target.value })}
                    placeholder="pt-PT"
                    className="w-full bg-input border border-border rounded-sm px-2 py-1.5 text-sm outline-none focus:ring-1 focus:ring-primary font-mono"
                  />
                </label>
                <label className="block">
                  <div className="label-mono mb-1">Timezone</div>
                  <input
                    value={profile.timezone}
                    onChange={(e) => update({ timezone: e.target.value })}
                    placeholder="Europe/Lisbon"
                    className="w-full bg-input border border-border rounded-sm px-2 py-1.5 text-sm outline-none focus:ring-1 focus:ring-primary font-mono"
                  />
                </label>
              </div>
            </section>

            <section className="panel p-4 flex items-center justify-between">
              <div>
                <div className="font-display font-semibold text-sm">Account</div>
                <div className="text-xs text-muted-foreground mt-0.5">{user?.email}</div>
              </div>
              <button
                onClick={signOut}
                className="flex items-center gap-1.5 text-xs px-3 py-2 rounded-sm bg-surface-2 hover:bg-destructive hover:text-destructive-foreground transition"
              >
                <LogOut className="h-3.5 w-3.5" /> Sign out
              </button>
            </section>
          </div>
        )}
      </div>
    </AppShell>
  );
}