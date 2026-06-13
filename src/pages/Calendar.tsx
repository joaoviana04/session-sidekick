import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  ChevronLeft,
  ChevronRight,
  CalendarDays,
  Mic,
  Sliders,
  PenLine,
  Zap,
  GitBranch,
  Receipt,
  Plus,
  Download,
  Pin,
  Trash2,
} from "lucide-react";
import {
  addMonths,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  startOfMonth,
  startOfWeek,
  addDays,
} from "date-fns";
import { AppShell } from "@/components/console/AppShell";
import { useSessions } from "@/lib/store/sessions";
import { useInvoices } from "@/lib/store/invoices";
import { useCalendarEvents } from "@/lib/store/calendarEvents";
import { buildIcs, downloadIcs } from "@/lib/ics";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

type EventItem = {
  date: Date;
  label: string;
  to: string;
  Icon: typeof Mic;
  cls: string;
  onDelete?: () => void;
};

const sessionIconMeta = (type: string) =>
  type === "recording"
    ? { Icon: Mic, cls: "text-info bg-info/10" }
    : type === "mix"
    ? { Icon: Sliders, cls: "text-primary bg-primary/10" }
    : type === "compose"
    ? { Icon: PenLine, cls: "text-accent bg-accent/10" }
    : { Icon: Zap, cls: "text-success bg-success/10" };

const Calendar = () => {
  const { sessions } = useSessions();
  const { invoices } = useInvoices();
  const { events: calEvents, create: createEvent, remove: removeEvent } = useCalendarEvents();
  const [month, setMonth] = useState(() => startOfMonth(new Date()));
  const [selected, setSelected] = useState<Date | null>(new Date());
  const [dialogOpen, setDialogOpen] = useState(false);

  // form state
  const [fTitle, setFTitle] = useState("");
  const [fSessionId, setFSessionId] = useState<string>("none");
  const [fDate, setFDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [fAllDay, setFAllDay] = useState(false);
  const [fStart, setFStart] = useState("10:00");
  const [fEnd, setFEnd] = useState("12:00");
  const [fLocation, setFLocation] = useState("");
  const [fNotes, setFNotes] = useState("");

  const openCreate = (forDate?: Date) => {
    const d = forDate ?? selected ?? new Date();
    setFTitle("");
    setFSessionId("none");
    setFDate(format(d, "yyyy-MM-dd"));
    setFAllDay(false);
    setFStart("10:00");
    setFEnd("12:00");
    setFLocation("");
    setFNotes("");
    setDialogOpen(true);
  };

  const submitEvent = async () => {
    const linkedSession = fSessionId !== "none" ? sessions.find((s) => s.id === fSessionId) : null;
    const title = fTitle.trim() || linkedSession?.title || "Untitled event";
    let startsAt: string;
    let endsAt: string | null;
    if (fAllDay) {
      startsAt = new Date(`${fDate}T00:00:00`).toISOString();
      endsAt = null;
    } else {
      startsAt = new Date(`${fDate}T${fStart}:00`).toISOString();
      endsAt = new Date(`${fDate}T${fEnd}:00`).toISOString();
    }
    try {
      await createEvent({
        title,
        startsAt,
        endsAt,
        allDay: fAllDay,
        location: fLocation,
        notes: fNotes,
        sessionId: linkedSession?.id ?? null,
        color: linkedSession ? "accent" : "primary",
      });
      toast.success("Event scheduled");
      setDialogOpen(false);
      setSelected(new Date(`${fDate}T00:00:00`));
    } catch (e: any) {
      toast.error(e?.message ?? "Failed to create event");
    }
  };

  const handleExportIcs = () => {
    const ics = buildIcs({ events: calEvents, sessions, invoices });
    downloadIcs(`seshcomp-${format(new Date(), "yyyy-MM-dd")}.ics`, ics);
    toast.success("Calendar exported", {
      description: "Subscribe to the .ics in Google or Apple Calendar.",
    });
  };

  const events = useMemo<EventItem[]>(() => {
    const out: EventItem[] = [];
    for (const ev of calEvents) {
      const linked = ev.sessionId ? sessions.find((s) => s.id === ev.sessionId) : null;
      out.push({
        date: new Date(ev.startsAt),
        label: ev.allDay
          ? `${ev.title}${ev.location ? ` · ${ev.location}` : ""}`
          : `${format(new Date(ev.startsAt), "HH:mm")}${ev.endsAt ? `–${format(new Date(ev.endsAt), "HH:mm")}` : ""} · ${ev.title}${ev.location ? ` · ${ev.location}` : ""}`,
        to: linked ? `/session/${linked.id}` : "#",
        Icon: Pin,
        cls: "text-primary bg-primary/10",
        onDelete: () => removeEvent(ev.id),
      });
    }
    for (const s of sessions) {
      const { Icon, cls } = sessionIconMeta(s.type);
      if (s.showDate) {
        out.push({ date: new Date(`${s.showDate}T00:00:00`), label: `${s.title} — show date`, to: `/session/${s.id}`, Icon, cls });
      }
      for (const r of s.revisions ?? []) {
        out.push({
          date: new Date(r.date),
          label: `${s.title} — revision ${r.version} (${r.status})`,
          to: `/session/${s.id}`,
          Icon: GitBranch,
          cls: "text-accent bg-accent/10",
        });
      }
    }
    for (const inv of invoices) {
      if (inv.dueDate) {
        out.push({
          date: new Date(`${inv.dueDate}T00:00:00`),
          label: `Invoice ${inv.number} due`,
          to: `/invoices/${inv.id}`,
          Icon: Receipt,
          cls: "text-warning bg-primary/10",
        });
      }
    }
    return out.sort((a, b) => a.date.getTime() - b.date.getTime());
  }, [sessions, invoices, calEvents, removeEvent]);

  const days = useMemo(() => {
    const start = startOfWeek(startOfMonth(month), { weekStartsOn: 1 });
    const end = endOfWeek(endOfMonth(month), { weekStartsOn: 1 });
    const out: Date[] = [];
    let d = start;
    while (d <= end) {
      out.push(d);
      d = addDays(d, 1);
    }
    return out;
  }, [month]);

  const eventsForDay = (day: Date) => events.filter((e) => isSameDay(e.date, day));
  const selectedEvents = selected ? eventsForDay(selected) : [];

  return (
    <AppShell>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-10 py-6 sm:py-10">
        <div className="flex items-start justify-between gap-4 mb-8">
          <div>
            <div className="label-mono mb-3">// schedule</div>
            <h1 className="font-display text-4xl font-bold tracking-tight">Calendar<span className="text-primary">.</span></h1>
          </div>
          <div className="flex items-center gap-2 shrink-0 flex-wrap justify-end">
            <Button size="sm" variant="outline" onClick={handleExportIcs} className="gap-1.5">
              <Download className="h-4 w-4" /> Export .ics
            </Button>
            <Button size="sm" onClick={() => openCreate()} className="gap-1.5">
              <Plus className="h-4 w-4" /> New event
            </Button>
            <div className="flex items-center gap-1 ml-1">
              <button onClick={() => setMonth((m) => addMonths(m, -1))}
                className="p-2 rounded-lg bg-surface-2 hover:bg-surface-3 transition">
                <ChevronLeft className="h-4 w-4" />
              </button>
              <div className="font-display font-semibold text-sm w-32 text-center">{format(month, "MMMM yyyy")}</div>
              <button onClick={() => setMonth((m) => addMonths(m, 1))}
                className="p-2 rounded-lg bg-surface-2 hover:bg-surface-3 transition">
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        <div className="panel p-3 sm:p-4 mb-6">
          <div className="grid grid-cols-7 gap-1 mb-1">
            {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => (
              <div key={d} className="label-mono text-center py-1">{d}</div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {days.map((day) => {
              const dayEvents = eventsForDay(day);
              const inMonth = isSameMonth(day, month);
              const isToday = isSameDay(day, new Date());
              const isSelected = selected && isSameDay(day, selected);
              return (
                <button
                  key={day.toISOString()}
                  onClick={() => setSelected(day)}
                  className={cn(
                    "aspect-square sm:aspect-[4/3] rounded-lg border p-1.5 sm:p-2 text-left transition flex flex-col gap-1",
                    inMonth ? "border-border/60" : "border-transparent opacity-35",
                    isSelected ? "bg-primary/10 border-primary/40" : "hover:bg-surface-2",
                  )}
                >
                  <span className={cn(
                    "font-mono text-xs tabular-nums",
                    isToday && "h-5 w-5 rounded-full bg-primary text-primary-foreground grid place-items-center font-semibold",
                  )}>
                    {format(day, "d")}
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {dayEvents.slice(0, 3).map((e, i) => (
                      <span key={i} className={cn("h-1.5 w-1.5 rounded-full", e.cls.split(" ")[1])} />
                    ))}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <div className="panel">
          <div className="panel-header">
            <div className="panel-icon">
              <CalendarDays className="h-4 w-4" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="panel-title">{selected ? format(selected, "EEEE, MMMM d") : "Select a day"}</div>
              <div className="panel-subtitle">{selectedEvents.length} events</div>
            </div>
            {selected && (
              <Button size="sm" variant="ghost" onClick={() => openCreate(selected)} className="gap-1.5">
                <Plus className="h-4 w-4" /> Add
              </Button>
            )}
          </div>
          <div className="divide-y divide-border/60">
            {selectedEvents.map((e, i) => (
              <div key={i} className="p-3 flex items-center gap-3 hover:bg-surface-2/40 transition group">
                {e.to === "#" ? (
                  <span className="flex items-center gap-3 flex-1 min-w-0">
                    <span className={cn("h-8 w-8 rounded-lg grid place-items-center shrink-0", e.cls)}>
                      <e.Icon className="h-4 w-4" />
                    </span>
                    <span className="text-sm truncate">{e.label}</span>
                  </span>
                ) : (
                  <Link to={e.to} className="flex items-center gap-3 flex-1 min-w-0">
                    <span className={cn("h-8 w-8 rounded-lg grid place-items-center shrink-0", e.cls)}>
                      <e.Icon className="h-4 w-4" />
                    </span>
                    <span className="text-sm truncate">{e.label}</span>
                  </Link>
                )}
                {e.onDelete && (
                  <button
                    onClick={e.onDelete}
                    className="opacity-0 group-hover:opacity-100 transition p-1.5 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive"
                    aria-label="Delete event"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            ))}
            {selectedEvents.length === 0 && (
              <div className="p-8 text-center text-muted-foreground text-sm">
                Nothing scheduled.{" "}
                <button onClick={() => openCreate(selected ?? undefined)} className="text-primary hover:underline">
                  Add event
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>New calendar event</DialogTitle>
            <DialogDescription>Schedule a session or block out time.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Link to session (optional)</Label>
              <Select value={fSessionId} onValueChange={setFSessionId}>
                <SelectTrigger className="mt-1.5">
                  <SelectValue placeholder="None — standalone event" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None — standalone event</SelectItem>
                  {sessions.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.title} · {s.type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="ev-title">Title</Label>
              <Input
                id="ev-title"
                value={fTitle}
                onChange={(e) => setFTitle(e.target.value)}
                placeholder={fSessionId !== "none" ? "Defaults to session title" : "e.g. Mix session — Album X"}
                className="mt-1.5"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="ev-date">Date</Label>
                <Input id="ev-date" type="date" value={fDate} onChange={(e) => setFDate(e.target.value)} className="mt-1.5" />
              </div>
              <div className="flex items-end gap-2 pb-2">
                <Switch id="ev-allday" checked={fAllDay} onCheckedChange={setFAllDay} />
                <Label htmlFor="ev-allday" className="cursor-pointer">All day</Label>
              </div>
            </div>
            {!fAllDay && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="ev-start">Start</Label>
                  <Input id="ev-start" type="time" value={fStart} onChange={(e) => setFStart(e.target.value)} className="mt-1.5" />
                </div>
                <div>
                  <Label htmlFor="ev-end">End</Label>
                  <Input id="ev-end" type="time" value={fEnd} onChange={(e) => setFEnd(e.target.value)} className="mt-1.5" />
                </div>
              </div>
            )}
            <div>
              <Label htmlFor="ev-loc">Location</Label>
              <Input
                id="ev-loc"
                value={fLocation}
                onChange={(e) => setFLocation(e.target.value)}
                placeholder="Studio A, Zoom, etc."
                className="mt-1.5"
              />
            </div>
            <div>
              <Label htmlFor="ev-notes">Notes</Label>
              <Textarea id="ev-notes" value={fNotes} onChange={(e) => setFNotes(e.target.value)} rows={3} className="mt-1.5" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={submitEvent}>Schedule</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
};

export default Calendar;
