import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import type { Invoice, InvoiceItem, InvoiceStatus } from "@/lib/types";

const uid = () => Math.random().toString(36).slice(2, 10);

function fromRow(r: any): Invoice {
  return {
    id: r.id,
    clientId: r.client_id ?? null,
    projectId: r.project_id ?? null,
    number: r.number ?? "",
    status: (r.status ?? "draft") as InvoiceStatus,
    issueDate: r.issue_date,
    dueDate: r.due_date ?? null,
    currency: r.currency ?? "EUR",
    items: r.items ?? [],
    notes: r.notes ?? "",
    createdAt: r.created_at,
  };
}

function toRowPatch(patch: Partial<Invoice>): Record<string, any> {
  const row: Record<string, any> = {};
  if ("clientId" in patch) row.client_id = patch.clientId;
  if ("projectId" in patch) row.project_id = patch.projectId;
  if ("number" in patch) row.number = patch.number;
  if ("status" in patch) row.status = patch.status;
  if ("issueDate" in patch) row.issue_date = patch.issueDate;
  if ("dueDate" in patch) row.due_date = patch.dueDate;
  if ("currency" in patch) row.currency = patch.currency;
  if ("items" in patch) row.items = patch.items;
  if ("notes" in patch) row.notes = patch.notes;
  return row;
}

export function useInvoices() {
  const { user } = useAuth();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);

  const refetch = useCallback(async () => {
    if (!user) {
      setInvoices([]);
      setLoading(false);
      return;
    }
    const { data, error } = await supabase
      .from("invoices")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) console.error(error);
    setInvoices((data ?? []).map(fromRow));
    setLoading(false);
  }, [user]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  const create = useCallback(
    async (patch: Partial<Invoice> = {}) => {
      if (!user) throw new Error("Not authenticated");
      const year = new Date().getFullYear();
      const seq = invoices.filter((i) => i.number.startsWith(`INV-${year}-`)).length + 1;
      const row = {
        user_id: user.id,
        client_id: patch.clientId ?? null,
        project_id: patch.projectId ?? null,
        number: patch.number || `INV-${year}-${String(seq).padStart(3, "0")}`,
        status: patch.status ?? "draft",
        issue_date: patch.issueDate || new Date().toISOString().slice(0, 10),
        due_date: patch.dueDate ?? null,
        currency: patch.currency || "EUR",
        items: (patch.items ?? []) as any,
        notes: patch.notes ?? "",
      };
      const { data, error } = await supabase.from("invoices").insert(row).select().single();
      if (error) throw error;
      const created = fromRow(data);
      setInvoices((arr) => [created, ...arr]);
      return created;
    },
    [user, invoices],
  );

  const update = useCallback(async (id: string, patch: Partial<Invoice>) => {
    setInvoices((arr) => arr.map((i) => (i.id === id ? { ...i, ...patch } : i)));
    const { error } = await supabase.from("invoices").update(toRowPatch(patch) as any).eq("id", id);
    if (error) console.error(error);
  }, []);

  const remove = useCallback(async (id: string) => {
    setInvoices((arr) => arr.filter((i) => i.id !== id));
    const { error } = await supabase.from("invoices").delete().eq("id", id);
    if (error) console.error(error);
  }, []);

  return { invoices, loading, create, update, remove, refetch };
}

export const invoiceHelpers = {
  uid,
  newItem: (): InvoiceItem => ({ id: uid(), description: "", quantity: 1, unitPrice: 0 }),
  total: (items: InvoiceItem[]) =>
    items.reduce((acc, i) => acc + (Number(i.quantity) || 0) * (Number(i.unitPrice) || 0), 0),
};
