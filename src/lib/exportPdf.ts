import jsPDF from "jspdf";
import type { Session, Project, Client } from "@/lib/types";

const M = 40;

export function exportSessionPdf(
  session: Session,
  project?: Project | null,
  client?: Client | null,
) {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  let y = M;

  const ensure = (h: number) => {
    if (y + h > pageH - M) {
      doc.addPage();
      y = M;
    }
  };

  const h1 = (text: string) => {
    ensure(28);
    doc.setFont("helvetica", "bold").setFontSize(18);
    doc.text(text, M, y);
    y += 24;
  };
  const h2 = (text: string) => {
    ensure(22);
    y += 8;
    doc.setFont("helvetica", "bold").setFontSize(12);
    doc.text(text.toUpperCase(), M, y);
    y += 4;
    doc.setDrawColor(180).line(M, y, pageW - M, y);
    y += 12;
  };
  const p = (text: string, opts: { mono?: boolean; muted?: boolean } = {}) => {
    if (!text) return;
    doc.setFont(opts.mono ? "courier" : "helvetica", "normal").setFontSize(10);
    if (opts.muted) doc.setTextColor(110);
    else doc.setTextColor(20);
    const lines = doc.splitTextToSize(text, pageW - M * 2);
    for (const ln of lines) {
      ensure(14);
      doc.text(ln, M, y);
      y += 13;
    }
    doc.setTextColor(20);
  };
  const kv = (rows: [string, string | undefined | null][]) => {
    doc.setFontSize(10);
    for (const [k, v] of rows) {
      if (!v) continue;
      ensure(14);
      doc.setFont("helvetica", "bold").setTextColor(90);
      doc.text(k, M, y);
      doc.setFont("helvetica", "normal").setTextColor(20);
      doc.text(String(v), M + 110, y);
      y += 14;
    }
  };

  // Header
  h1(session.title || "Untitled session");
  doc.setFont("helvetica", "normal").setFontSize(10).setTextColor(110);
  const sub = [session.type.toUpperCase(), session.artist].filter(Boolean).join(" · ");
  doc.text(sub, M, y);
  y += 16;
  doc.setTextColor(20);

  kv([
    ["Created", new Date(session.createdAt).toLocaleString()],
    ["Project", project?.name ?? null],
    ["Client", client?.name ?? null],
    ["Format", session.sampleRate ?? null],
    ["BPM", session.bpm ? String(session.bpm) : null],
    ["Key", session.key ?? null],
    ["Venue", session.venue ?? null],
    ["Show date", session.showDate ?? null],
    ["PA system", session.paSystem ?? null],
    ["FOH console", session.fohConsole ?? null],
    ["Monitor console", session.monitorConsole ?? null],
    ["LUFS target", session.lufsTarget ?? null],
    ["True peak", session.truePeakTarget ?? null],
  ]);

  // Time log
  if (session.timeLog && session.timeLog.length) {
    h2("Time log");
    let total = 0;
    for (const e of session.timeLog) {
      const start = new Date(e.start).getTime();
      const end = e.end ? new Date(e.end).getTime() : Date.now();
      const dur = Math.max(0, end - start);
      total += dur;
      const fmtDate = new Date(e.start).toLocaleString();
      const fmtEnd = e.end ? new Date(e.end).toLocaleTimeString() : "running";
      const h = Math.floor(dur / 3_600_000);
      const m = Math.floor((dur % 3_600_000) / 60_000);
      p(`• ${fmtDate} → ${fmtEnd}   (${h}h ${m}m)`, { mono: true });
    }
    const th = Math.floor(total / 3_600_000);
    const tm = Math.floor((total % 3_600_000) / 60_000);
    p(`Total: ${th}h ${tm}m`, { mono: true });
  }

  // Inputs
  if (session.inputs && session.inputs.length) {
    h2(session.type === "live" ? "Patch list" : "Input list");
    for (const i of session.inputs) {
      const opts = [i.phantom && "48V", i.pad && "PAD", i.hpf && "HPF"]
        .filter(Boolean)
        .join(" ");
      const line = `Ch ${String(i.ch).padStart(2, "0")}  ${i.source || "-"}  |  ${i.mic || "-"}  |  ${i.preamp || "-"}${opts ? "  [" + opts + "]" : ""}`;
      p(line, { mono: true });
      if (i.notes) p(`     ${i.notes}`, { mono: true, muted: true });
    }
  }

  // Takes
  if (session.takes && session.takes.length) {
    h2("Take log");
    for (const t of session.takes) {
      const time = new Date(t.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
      p(`${time}  ${t.song}  #${t.number}  [${t.rating}]`, { mono: true });
      if (t.notes) p(`     ${t.notes}`, { mono: true, muted: true });
    }
  }

  // Checklist
  if (session.checklist && session.checklist.length) {
    h2("Checklist");
    const groups = Array.from(new Set(session.checklist.map((c) => c.group)));
    for (const g of groups) {
      doc.setFont("helvetica", "bold").setFontSize(10);
      ensure(14);
      doc.text(g, M, y);
      y += 14;
      for (const c of session.checklist.filter((x) => x.group === g)) {
        p(`  ${c.done ? "[x]" : "[ ]"} ${c.label}`, { mono: true });
      }
    }
  }

  // References
  if (session.references && session.references.length) {
    h2("References");
    for (const r of session.references) {
      p(`${r.title || "(untitled)"} — ${r.artist || "-"}  ${r.lufs ? "(" + r.lufs + ")" : ""}`);
      if (r.notes) p(`  ${r.notes}`, { muted: true });
    }
  }

  // Revisions
  if (session.revisions && session.revisions.length) {
    h2("Revisions");
    for (const r of session.revisions) {
      p(`v${r.version} · ${new Date(r.date).toLocaleDateString()} · ${r.status}`);
      if (r.changes) p(`  changes: ${r.changes}`, { muted: true });
      if (r.feedback) p(`  feedback: ${r.feedback}`, { muted: true });
    }
  }

  // Setlist
  if (session.setlist && session.setlist.length) {
    h2("Setlist");
    const sorted = session.setlist.slice().sort((a, b) => a.position - b.position);
    for (const s of sorted) {
      p(`${String(s.position).padStart(2, "0")}. ${s.title}  ${s.bpm ? s.bpm + " BPM" : ""}  ${s.key ? "(" + s.key + ")" : ""}  ${s.duration || ""}`, { mono: true });
      if (s.cues) p(`     cues: ${s.cues}`, { mono: true, muted: true });
      if (s.notes) p(`     ${s.notes}`, { mono: true, muted: true });
    }
  }

  // Monitor mixes
  if (session.monitorMixes && session.monitorMixes.length) {
    h2("Monitor mixes");
    for (const m of session.monitorMixes) {
      p(`Mix ${m.mixNumber} · ${m.performer} · ${m.type}`, { mono: true });
      if (m.contents) p(`  ${m.contents}`, { mono: true, muted: true });
      if (m.notes) p(`  notes: ${m.notes}`, { mono: true, muted: true });
    }
  }

  // Show log
  if (session.showLog && session.showLog.length) {
    h2("Show log");
    for (const e of session.showLog) {
      p(`${new Date(e.timestamp).toLocaleTimeString()} [${e.severity}] ${e.message}`, { mono: true });
    }
  }

  // Notes
  if (session.notes) {
    h2("Notes");
    p(session.notes, { mono: true });
  }

  const safe = (session.title || "session").replace(/[^a-z0-9-_ ]/gi, "_").slice(0, 60);
  doc.save(`${safe}.pdf`);
}