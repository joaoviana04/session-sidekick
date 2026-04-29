import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

const admin = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
);

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const token = url.searchParams.get("token")?.trim();
    if (!token) return json({ error: "Missing token" }, 400);

    // Look up share + session
    const { data: share, error: shareErr } = await admin
      .from("session_shares")
      .select("id, session_id, active")
      .eq("token", token)
      .maybeSingle();

    if (shareErr) return json({ error: shareErr.message }, 500);
    if (!share || !share.active) {
      return json({ error: "Share not found or inactive" }, 404);
    }

    const { data: session, error: sessionErr } = await admin
      .from("sessions")
      .select("id, title, artist, type, revisions")
      .eq("id", share.session_id)
      .maybeSingle();

    if (sessionErr) return json({ error: sessionErr.message }, 500);
    if (!session) return json({ error: "Session not found" }, 404);

    if (req.method === "GET") {
      const { data: feedback, error: fbErr } = await admin
        .from("revision_feedback")
        .select("id, revision_id, client_name, feedback, decision, updated_at")
        .eq("share_id", share.id);
      if (fbErr) return json({ error: fbErr.message }, 500);

      return json({
        share: { id: share.id, session_id: share.session_id },
        session: {
          id: session.id,
          title: session.title,
          artist: session.artist,
          type: session.type,
          revisions: session.revisions ?? [],
        },
        feedback: feedback ?? [],
      });
    }

    if (req.method === "POST") {
      const body = await req.json().catch(() => null) as {
        revision_id?: string;
        client_name?: string;
        feedback?: string;
        decision?: "pending" | "approved" | "revise";
      } | null;

      if (!body?.revision_id) {
        return json({ error: "revision_id required" }, 400);
      }
      const decision = body.decision ?? "pending";
      if (!["pending", "approved", "revise"].includes(decision)) {
        return json({ error: "Invalid decision" }, 400);
      }

      // Confirm revision exists in session
      const revs = (session.revisions ?? []) as Array<{ id: string }>;
      if (!revs.find((r) => r.id === body.revision_id)) {
        return json({ error: "Revision not found" }, 404);
      }

      const payload = {
        share_id: share.id,
        session_id: share.session_id,
        revision_id: body.revision_id,
        client_name: (body.client_name ?? "").slice(0, 120),
        feedback: (body.feedback ?? "").slice(0, 4000),
        decision,
      };

      const { data, error } = await admin
        .from("revision_feedback")
        .upsert(payload, { onConflict: "share_id,revision_id" })
        .select()
        .single();

      if (error) return json({ error: error.message }, 500);
      return json({ ok: true, feedback: data });
    }

    return json({ error: "Method not allowed" }, 405);
  } catch (e) {
    return json({ error: (e as Error).message }, 500);
  }
});