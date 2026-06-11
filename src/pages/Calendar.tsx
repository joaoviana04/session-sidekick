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
import { cn } from "@/lib/utils";

type EventItem = {
  date: Date;
  label: string;
  to: string;
  Icon: typeof Mic;
  cls: string;
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
  const [month, setMonth] = useState(() => startOfMonth(new Date()));
  const [selected, setSelected] = useState<Date | null>(new Date());

  const events = useMemo<EventItem[]>(() => {
    const out: EventItem[] = [];
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
    return out;
  }, [sessions, invoices]);

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
          <div className="flex items-center gap-1 shrink-0">
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
          </div>
          <div className="divide-y divide-border/60">
            {selectedEvents.map((e, i) => (
              <Link key={i} to={e.to} className="p-3 flex items-center gap-3 hover:bg-surface-2/40 transition">
                <span className={cn("h-8 w-8 rounded-lg grid place-items-center shrink-0", e.cls)}>
                  <e.Icon className="h-4 w-4" />
                </span>
                <span className="text-sm">{e.label}</span>
              </Link>
            ))}
            {selectedEvents.length === 0 && (
              <div className="p-8 text-center text-muted-foreground text-sm">Nothing scheduled.</div>
            )}
          </div>
        </div>
      </div>
    </AppShell>
  );
};

export default Calendar;
