import type { CalendarEvent, Session, Invoice } from "@/lib/types";

function pad(n: number) {
  return String(n).padStart(2, "0");
}

function toIcsDateTime(iso: string) {
  const d = new Date(iso);
  return (
    `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}` +
    `T${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}${pad(d.getUTCSeconds())}Z`
  );
}

function toIcsDate(ymd: string) {
  // expects YYYY-MM-DD
  return ymd.replace(/-/g, "");
}

function esc(s: string) {
  return (s ?? "")
    .replace(/\\/g, "\\\\")
    .replace(/\n/g, "\\n")
    .replace(/,/g, "\\,")
    .replace(/;/g, "\\;");
}

interface BuildIcsArgs {
  events: CalendarEvent[];
  sessions: Session[];
  invoices: Invoice[];
}

export function buildIcs({ events, sessions, invoices }: BuildIcsArgs): string {
  const stamp = toIcsDateTime(new Date().toISOString());
  const lines: string[] = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//SeshComp//Calendar//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
  ];

  for (const ev of events) {
    lines.push("BEGIN:VEVENT");
    lines.push(`UID:event-${ev.id}@seshcomp`);
    lines.push(`DTSTAMP:${stamp}`);
    if (ev.allDay) {
      const ymd = ev.startsAt.slice(0, 10);
      lines.push(`DTSTART;VALUE=DATE:${toIcsDate(ymd)}`);
      const end = ev.endsAt ? ev.endsAt.slice(0, 10) : ymd;
      // DTEND is exclusive for all-day; bump one day
      const d = new Date(`${end}T00:00:00Z`);
      d.setUTCDate(d.getUTCDate() + 1);
      lines.push(`DTEND;VALUE=DATE:${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}`);
    } else {
      lines.push(`DTSTART:${toIcsDateTime(ev.startsAt)}`);
      if (ev.endsAt) lines.push(`DTEND:${toIcsDateTime(ev.endsAt)}`);
    }
    lines.push(`SUMMARY:${esc(ev.title || "Untitled")}`);
    if (ev.location) lines.push(`LOCATION:${esc(ev.location)}`);
    if (ev.notes) lines.push(`DESCRIPTION:${esc(ev.notes)}`);
    lines.push("END:VEVENT");
  }

  for (const s of sessions) {
    if (!s.showDate) continue;
    lines.push("BEGIN:VEVENT");
    lines.push(`UID:session-${s.id}@seshcomp`);
    lines.push(`DTSTAMP:${stamp}`);
    lines.push(`DTSTART;VALUE=DATE:${toIcsDate(s.showDate)}`);
    lines.push(`SUMMARY:${esc(`${s.title} — ${s.type}`)}`);
    if (s.venue) lines.push(`LOCATION:${esc(s.venue)}`);
    if (s.notes) lines.push(`DESCRIPTION:${esc(s.notes)}`);
    lines.push("END:VEVENT");
  }

  for (const inv of invoices) {
    if (!inv.dueDate) continue;
    lines.push("BEGIN:VEVENT");
    lines.push(`UID:invoice-${inv.id}@seshcomp`);
    lines.push(`DTSTAMP:${stamp}`);
    lines.push(`DTSTART;VALUE=DATE:${toIcsDate(inv.dueDate)}`);
    lines.push(`SUMMARY:${esc(`Invoice ${inv.number} due`)}`);
    lines.push("END:VEVENT");
  }

  lines.push("END:VCALENDAR");
  return lines.join("\r\n");
}

export function downloadIcs(filename: string, content: string) {
  const blob = new Blob([content], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}