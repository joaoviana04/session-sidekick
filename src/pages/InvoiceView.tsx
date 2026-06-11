import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft, Plus, Trash2, Download, Receipt, Clock } from "lucide-react";
import { AppShell } from "@/components/console/AppShell";
import { useInvoices, invoiceHelpers } from "@/lib/store/invoices";
import { useClients } from "@/lib/store/clients";
import { useProjects } from "@/lib/store/projects";
import { useSessions } from "@/lib/store/sessions";
import { useProfile, formatCurrency } from "@/lib/store/profile";
import { useAuth } from "@/hooks/useAuth";
import { exportInvoicePdf } from "@/lib/exportPdf";
import { cn } from "@/lib/utils";
import type { InvoiceStatus } from "@/lib/types";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const statusOptions: InvoiceStatus[] = ["draft", "sent", "paid", "overdue"];
const statusColors: Record<InvoiceStatus, string> = {
  draft: "bg-surface-3 text-muted-foreground border-border",
  sent: "bg-info/20 text-info border-info/30",
  paid: "bg-success/20 text-success border-success/30",
  overdue: "bg-destructive/20 text-destructive border-destructive/30",
};

function sessionHours(session: { timeLog?: { start: string; end: string | null }[] }) {
  const log = session.timeLog ?? [];
  let total = 0;
  for (const e of log) {
    const start = new Date(e.start).getTime();
    const end = e.end ? new Date(e.end).getTime() : Date.now();
    total += Math.max(0, end - start);
  }
  return total / 3_600_000;
}

const InvoiceView = () => {
  const { id } = useParams<{ id: string }>();
  const { invoices, update, remove } = useInvoices();
  const { clients } = useClients();
  const { projects } = useProjects();
  const { sessions } = useSessions();
  const { profile } = useProfile();
  const { user } = useAuth();
  const [navigateAway, setNavigateAway] = useState(false);

  const invoice = invoices.find((i) => i.id === id);

  if (!invoice || navigateAway) {
    return (
      <AppShell>
        <div className="p-10 text-center text-muted-foreground">
          <Link to="/invoices" className="text-xs hover:text-foreground inline-flex items-center gap-1 mb-4">
            <ArrowLeft className="h-3.5 w-3.5" /> Invoices
          </Link>
          {!navigateAway && <div>Invoice not found.</div>}
        </div>
      </AppShell>
    );
  }

  const project = projects.find((p) => p.id === invoice.projectId);
  const client = clients.find((c) => c.id === invoice.clientId);
  const total = invoiceHelpers.total(invoice.items);

  const setItems = (fn: (items: typeof invoice.items) => typeof invoice.items) =>
    update(invoice.id, { items: fn(invoice.items) });

  const addFromSession = (sessionId: string) => {
    const s = sessions.find((x) => x.id === sessionId);
    if (!s) return;
    const hours = sessionHours(s);
    const rate = s.hourlyRate != null && s.hourlyRate > 0 ? s.hourlyRate : profile.hourlyRate ?? 0;
    setItems((items) => [
      ...items,
      {
        id: invoiceHelpers.uid(),
        description: `${s.title} — ${hours.toFixed(2)}h @ ${formatCurrency(rate, invoice.currency)}/h`,
        quantity: Math.round(hours * 100) / 100,
        unitPrice: rate,
      },
    ]);
  };

  return (
    <AppShell>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-10 py-6 sm:py-8">
        <Link to="/invoices" className="text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1 mb-4">
          <ArrowLeft className="h-3.5 w-3.5" /> Invoices
        </Link>

        <div className="panel mb-6">
          <div className="panel-header">
            <div className="panel-icon">
              <Receipt className="h-4 w-4" />
            </div>
            <div className="min-w-0 flex-1">
              <input
                value={invoice.number}
                onChange={(e) => update(invoice.id, { number: e.target.value })}
                className="panel-title bg-transparent outline-none focus:bg-surface-2 rounded-sm px-1 -mx-1 w-full"
              />
              <div className="panel-subtitle">Issued {new Date(invoice.issueDate).toLocaleDateString()}</div>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              {statusOptions.map((st) => (
                <button key={st} onClick={() => update(invoice.id, { status: st })}
                  className={cn(
                    "text-[10px] uppercase tracking-wider px-2 py-1 rounded-sm border transition",
                    invoice.status === st ? statusColors[st] : "border-transparent text-muted-foreground hover:bg-surface-2"
                  )}>{st}</button>
              ))}
            </div>
          </div>

          <div className="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <label className="block">
              <div className="label-mono mb-1">Client</div>
              <select value={invoice.clientId ?? ""} onChange={(e) => update(invoice.id, { clientId: e.target.value || null })}
                className="w-full bg-input border border-border rounded-sm px-2 py-1.5 text-sm outline-none focus:ring-1 focus:ring-primary">
                <option value="">— No client —</option>
                {clients.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </label>
            <label className="block">
              <div className="label-mono mb-1">Project</div>
              <select value={invoice.projectId ?? ""} onChange={(e) => update(invoice.id, { projectId: e.target.value || null })}
                className="w-full bg-input border border-border rounded-sm px-2 py-1.5 text-sm outline-none focus:ring-1 focus:ring-primary">
                <option value="">— No project —</option>
                {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </label>
            <label className="block">
              <div className="label-mono mb-1">Issue date</div>
              <input type="date" value={invoice.issueDate} onChange={(e) => update(invoice.id, { issueDate: e.target.value })}
                className="w-full bg-input border border-border rounded-sm px-2 py-1.5 text-sm font-mono outline-none focus:ring-1 focus:ring-primary" />
            </label>
            <label className="block">
              <div className="label-mono mb-1">Due date</div>
              <input type="date" value={invoice.dueDate ?? ""} onChange={(e) => update(invoice.id, { dueDate: e.target.value || null })}
                className="w-full bg-input border border-border rounded-sm px-2 py-1.5 text-sm font-mono outline-none focus:ring-1 focus:ring-primary" />
            </label>
          </div>
        </div>

        <div className="panel mb-6">
          <div className="panel-header">
            <div className="min-w-0 flex-1">
              <div className="panel-title">Line items</div>
              <div className="panel-subtitle">{invoice.items.length} items · total {formatCurrency(total, invoice.currency)}</div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {sessions.length > 0 && (
                <DropdownMenu>
                  <DropdownMenuTrigger className="flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg bg-surface-2 hover:bg-surface-3 transition">
                    <Clock className="h-3.5 w-3.5" /> <span className="hidden sm:inline">From session</span>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-64 max-h-72 overflow-auto">
                    {sessions.map((s) => (
                      <DropdownMenuItem key={s.id} onClick={() => addFromSession(s.id)}>
                        <div className="min-w-0">
                          <div className="text-sm truncate">{s.title}</div>
                          <div className="text-xs text-muted-foreground">{sessionHours(s).toFixed(2)}h logged</div>
                        </div>
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
              <button onClick={() => setItems((items) => [...items, invoiceHelpers.newItem()])}
                className="flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg bg-surface-2 hover:bg-surface-3 transition">
                <Plus className="h-3.5 w-3.5" /> Item
              </button>
            </div>
          </div>

          <div className="divide-y divide-border/60">
            {invoice.items.map((item) => (
              <div key={item.id} className="p-3 grid grid-cols-12 gap-2 items-center group">
                <input value={item.description} onChange={(e) => setItems((items) => items.map((x) => x.id === item.id ? { ...x, description: e.target.value } : x))}
                  placeholder="Description" className="col-span-12 sm:col-span-6 bg-input border border-border rounded-sm px-2 py-1.5 text-sm outline-none focus:ring-1 focus:ring-primary" />
                <input type="number" min="0" step="0.01" value={item.quantity} onChange={(e) => setItems((items) => items.map((x) => x.id === item.id ? { ...x, quantity: Number(e.target.value) } : x))}
                  placeholder="Qty" className="col-span-3 sm:col-span-2 bg-input border border-border rounded-sm px-2 py-1.5 text-sm font-mono outline-none focus:ring-1 focus:ring-primary" />
                <input type="number" min="0" step="0.01" value={item.unitPrice} onChange={(e) => setItems((items) => items.map((x) => x.id === item.id ? { ...x, unitPrice: Number(e.target.value) } : x))}
                  placeholder="Unit price" className="col-span-4 sm:col-span-2 bg-input border border-border rounded-sm px-2 py-1.5 text-sm font-mono outline-none focus:ring-1 focus:ring-primary" />
                <div className="col-span-4 sm:col-span-1 font-mono text-sm text-right tabular-nums">
                  {formatCurrency(item.quantity * item.unitPrice, invoice.currency)}
                </div>
                <button onClick={() => setItems((items) => items.filter((x) => x.id !== item.id))}
                  className="col-span-1 justify-self-end text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100">
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
            {invoice.items.length === 0 && (
              <div className="p-8 text-center text-muted-foreground text-sm">No line items yet.</div>
            )}
          </div>
        </div>

        <div className="panel p-4 mb-6">
          <div className="label-mono mb-2">Notes</div>
          <textarea value={invoice.notes} onChange={(e) => update(invoice.id, { notes: e.target.value })}
            rows={3} placeholder="Payment terms, bank details…"
            className="w-full bg-input border border-border rounded-sm p-2 text-sm outline-none focus:ring-1 focus:ring-primary resize-none" />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button onClick={() => exportInvoicePdf(invoice, client, project, { displayName: profile.displayName, email: user?.email })}
            className="flex items-center gap-1.5 text-sm px-3.5 py-2 rounded-lg bg-gradient-amber text-primary-foreground font-semibold hover:opacity-90 transition">
            <Download className="h-4 w-4" /> Export PDF
          </button>
          <button onClick={() => { if (confirm(`Delete invoice ${invoice.number}?`)) { remove(invoice.id); setNavigateAway(true); } }}
            className="flex items-center gap-1.5 text-sm px-3.5 py-2 rounded-lg border border-border text-muted-foreground hover:text-destructive hover:border-destructive/40 transition">
            <Trash2 className="h-4 w-4" /> Delete invoice
          </button>
        </div>
      </div>
    </AppShell>
  );
};

export default InvoiceView;
