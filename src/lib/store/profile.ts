import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export interface Profile {
  id: string;
  displayName: string;
  avatarUrl: string;
  bio: string;
  hourlyRate: number | null;
  currency: string;
  timezone: string;
  locale: string;
}

const DEFAULT: Profile = {
  id: "",
  displayName: "",
  avatarUrl: "",
  bio: "",
  hourlyRate: null,
  currency: "EUR",
  timezone: "",
  locale: "",
};

function fromRow(r: any): Profile {
  return {
    id: r.id,
    displayName: r.display_name ?? "",
    avatarUrl: r.avatar_url ?? "",
    bio: r.bio ?? "",
    hourlyRate: r.hourly_rate == null ? null : Number(r.hourly_rate),
    currency: r.currency ?? "EUR",
    timezone: r.timezone ?? "",
    locale: r.locale ?? "",
  };
}

export function useProfile() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile>(DEFAULT);
  const [loading, setLoading] = useState(true);
  const debounce = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    let cancelled = false;
    if (!user) {
      setProfile(DEFAULT);
      setLoading(false);
      return;
    }
    setLoading(true);
    supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .maybeSingle()
      .then(({ data, error }) => {
        if (cancelled) return;
        if (error) console.error(error);
        if (data) setProfile(fromRow(data));
        else setProfile({ ...DEFAULT, id: user.id });
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [user]);

  const update = useCallback(
    (patch: Partial<Profile>) => {
      if (!user) return;
      setProfile((p) => ({ ...p, ...patch }));
      const row: any = {};
      if ("displayName" in patch) row.display_name = patch.displayName;
      if ("avatarUrl" in patch) row.avatar_url = patch.avatarUrl;
      if ("bio" in patch) row.bio = patch.bio;
      if ("hourlyRate" in patch) row.hourly_rate = patch.hourlyRate;
      if ("currency" in patch) row.currency = patch.currency;
      if ("timezone" in patch) row.timezone = patch.timezone;
      if ("locale" in patch) row.locale = patch.locale;
      if (debounce.current) clearTimeout(debounce.current);
      debounce.current = setTimeout(async () => {
        const { error } = await supabase
          .from("profiles")
          .upsert({ id: user.id, ...row }, { onConflict: "id" });
        if (error) console.error(error);
      }, 500);
    },
    [user],
  );

  return { profile, loading, update };
}

export function formatCurrency(amount: number, currency: string, locale?: string) {
  try {
    return new Intl.NumberFormat(locale || undefined, {
      style: "currency",
      currency: currency || "EUR",
      maximumFractionDigits: 2,
    }).format(amount);
  } catch {
    return `${amount.toFixed(2)} ${currency}`;
  }
}