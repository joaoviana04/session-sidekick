import { Link, useNavigate } from "react-router-dom";
import { Plus, Receipt, Trash2, ArrowUpRight } from "lucide-react";
import { AppShell } from "@/components/console/AppShell";
import { useInvoices, invoiceHelpers } from "@/lib/store/invoices";
import { useClients } from "@/lib/store/clients";
import { useProjects } from "@/lib/store/projects";
import { useProfile, formatCurrency } from "@/lib/store/profile";
import { cn } from "@/lib/utils";
import type { InvoiceStatus } from "@/lib/types";

const statusColors: Record<InvoiceStatus, string> = {
  draft: "bg-surface-3 text-muted-foreground border-border",
  sent: "bg-info/20 text-info border-info/30",
  paid: "bg-success/20 text-success border-success/30",
  overdue: "bg-destructive/20 text-destructive border-destructive/30",
};

const Invoices = () => {
  const { invoices, create, remove } = useInvoices();
  const { clients } = useClients();
  const { projects } = useProjects();
  const { profile } = useProfile();
  const nav = useNavigate();

  const onCreate = async () => {
    const inv = await create({ currency: profile.currency || "EUR" });
    nav(`/invoices/${inv.id}`);
  };

  return (
    <AppShell>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-10 py-6 sm:py-10">
        <div className="flex items-start justify-between gap-4 mb-8">
          <div>
            <div className="label-mono mb-3">// billing</div>
            <h1 className="font-display text-4xl font-bold tracking-tight">Invoices<span className="text-primary">.</span></h1>
          </div>
          <button onClick={onCreate}
            className="flex items-center gap-1.5 text-sm px-3.5 py-2 rounded-lg bg-gradient-amber text-primary-foreground font-semibold hover:opacity-90 transition shrink-0">
            <Plus className="h-4 w-4" /> New invoice
          </button>
        </div>

        <div className="panel divide-y divide-border/60">
          {invoices.map((inv) => {
            const client = clients.find((c) => c.id === inv.clientId);
            const project = projects.find((p) => p.id === inv.projectId);
            const total = invoiceHelpers.total(inv.items);
            return (
              <div key={inv.id} className="p-4 flex items-center gap-3 group hover:bg-surface-2/40">
                <div className="h-9 w-9 rounded-lg bg-surface-2 grid place-items-center text-primary shrink-0">
                  <Receipt className="h-4 w-4" />
                </div>
                <Link to={`/invoices/${inv.id}`} className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-display font-semibold group-hover:text-primary transition">{inv.number}</span>
                    <span className={cn("text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-sm border", statusColors[inv.status])}>
                      {inv.status}
                    </span>
                  </div>
                  <div className="text-xs text-muted-foreground truncate mt-0.5">
                    {client?.name ?? "No client"}{project ? ` · ${project.name}` : ""}
                    {inv.dueDate ? ` · due ${new Date(inv.dueDate).toLocaleDateString()}` : ""}
                  </div>
                </Link>
                <div className="font-mono text-sm tabular-nums shrink-0">{formatCurrency(total, inv.currency)}</div>
                <Link to={`/invoices/${inv.id}`} className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-primary shrink-0">
                  <ArrowUpRight className="h-4 w-4" />
                </Link>
                <button onClick={() => { if (confirm(`Delete invoice ${inv.number}?`)) remove(inv.id); }}
                  className="text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 shrink-0">
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            );
          })}
          {invoices.length === 0 && (
            <div className="p-10 text-center text-muted-foreground text-sm">
              No invoices yet. Create one to bill a client for sessions.
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
};

export default Invoices;
