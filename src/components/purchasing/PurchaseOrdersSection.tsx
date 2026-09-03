import { LoaderCircle, Plus, ShoppingBag, Trash2, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { api, ApiError, type Product, type PurchaseOrder, type Supplier } from "@/lib/api";
import { formatCurrency, formatDate } from "@/lib/format";
import { useI18n } from "@/lib/i18n";

const STATUS_TONE: Record<string, "neutral" | "primary" | "accent" | "success" | "destructive"> = {
  DRAFT: "neutral",
  SUBMITTED: "accent",
  APPROVED: "primary",
  PARTIALLY_RECEIVED: "primary",
  RECEIVED: "success",
  CANCELLED: "destructive",
  CLOSED: "neutral",
};

const STATUS_LABEL: Record<string, string> = {
  DRAFT: "Brouillon",
  SUBMITTED: "Soumis",
  APPROVED: "Approuvé",
  PARTIALLY_RECEIVED: "Partiellement reçu",
  RECEIVED: "Reçu",
  CANCELLED: "Annulé",
  CLOSED: "Clôturé",
};

interface Line {
  productId: string;
  name: string;
  quantity: number;
  unitCost: number;
}

interface PurchaseOrdersSectionProps {
  orders: PurchaseOrder[];
  suppliers: Supplier[];
  storeId: string;
  onChanged: () => void;
}

export function PurchaseOrdersSection({ orders, suppliers, storeId, onChanged }: PurchaseOrdersSectionProps) {
  const { t } = useI18n();
  const [showForm, setShowForm] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState("");
  const [viewingId, setViewingId] = useState<string | null>(null);
  const supplierById = new Map(suppliers.map((s) => [s.id, s.name]));

  const filteredOrders = useMemo(
    () => (statusFilter ? orders.filter((o) => o.status === statusFilter) : orders),
    [orders, statusFilter],
  );
  const statuses = useMemo(() => [...new Set(orders.map((o) => o.status))], [orders]);

  async function runAction(id: string, action: "submit" | "approve" | "cancel" | "receive") {
    setBusyId(id);
    setActionError(null);
    try {
      if (action === "receive") {
        const order = await api.purchaseOrders.findOne(id);
        await api.goodsReceipts.create({
          storeId: order.storeId,
          purchaseOrderId: id,
          items: (order.items ?? []).map((i) => ({
            productId: i.productId,
            quantity: Number(i.quantity),
            unitCost: Number(i.unitCost),
          })),
        });
      } else {
        await api.purchaseOrders[action](id);
      }
      onChanged();
    } catch (err) {
      setActionError(err instanceof ApiError ? err.message : "Action impossible");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <section className="mt-10">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold text-foreground">{t("purchasing.orders")}</h2>
        <Button variant="outline" size="sm" onClick={() => setShowForm((v) => !v)}>
          {showForm ? <X /> : <Plus />}
          {showForm ? t("common.cancel") : t("purchasing.newOrder")}
        </Button>
      </div>

      {showForm && (
        <NewPurchaseOrderForm
          suppliers={suppliers}
          storeId={storeId}
          onCreated={() => {
            setShowForm(false);
            onChanged();
          }}
        />
      )}

      {actionError && <p className="mt-3 text-sm text-destructive">{actionError}</p>}

      {statuses.length > 1 && (
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="mt-3 flex h-9 w-56 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
        >
          <option value="">{t("purchasing.statusFilter")}</option>
          {statuses.map((s) => (
            <option key={s} value={s}>
              {STATUS_LABEL[s] ?? s}
            </option>
          ))}
        </select>
      )}

      <div className="mt-3 overflow-hidden rounded-lg border border-border bg-card">
        {filteredOrders.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-12 text-center text-muted-foreground">
            <ShoppingBag className="size-7" />
            <p className="text-sm">{t("purchasing.noOrders")}</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs text-muted-foreground uppercase">
                <th className="px-4 py-3 font-medium">{t("purchasing.colReference")}</th>
                <th className="px-4 py-3 font-medium">{t("purchasing.colSupplier")}</th>
                <th className="px-4 py-3 font-medium">{t("common.status")}</th>
                <th className="px-4 py-3 font-medium">{t("purchasing.colTotal")}</th>
                <th className="px-4 py-3 font-medium">{t("purchasing.colCreated")}</th>
                <th className="px-4 py-3 font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.map((o) => (
                <tr
                  key={o.id}
                  onClick={() => setViewingId(o.id)}
                  className="cursor-pointer border-b border-border last:border-0 hover:bg-secondary/50"
                >
                  <td className="px-4 py-3 font-medium text-foreground">{o.reference}</td>
                  <td className="px-4 py-3 text-muted-foreground">{supplierById.get(o.supplierId) ?? "—"}</td>
                  <td className="px-4 py-3">
                    <Badge tone={STATUS_TONE[o.status] ?? "neutral"}>
                      {STATUS_LABEL[o.status] ?? o.status}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">{formatCurrency(Number(o.totalAmount))}</td>
                  <td className="px-4 py-3 text-muted-foreground">{formatDate(o.createdAt)}</td>
                  <td className="px-4 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                    <PurchaseOrderActions status={o.status} busy={busyId === o.id} onAction={(a) => runAction(o.id, a)} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {viewingId && (
        <PurchaseOrderDetailsDialog
          id={viewingId}
          supplierName={
            supplierById.get(orders.find((o) => o.id === viewingId)?.supplierId ?? "") ?? "—"
          }
          onClose={() => setViewingId(null)}
        />
      )}
    </section>
  );
}

function PurchaseOrderDetailsDialog({
  id,
  supplierName,
  onClose,
}: {
  id: string;
  supplierName: string;
  onClose: () => void;
}) {
  const { t } = useI18n();
  const [order, setOrder] = useState<PurchaseOrder | null>(null);
  const [productNames, setProductNames] = useState<Map<string, string>>(new Map());
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([api.purchaseOrders.findOne(id), api.products.search("")])
      .then(([o, products]) => {
        setOrder(o);
        setProductNames(new Map(products.map((p) => [p.id, p.name])));
      })
      .catch((err) => setError(err instanceof ApiError ? err.message : "Impossible de charger la commande"));
  }, [id]);

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{order?.reference ?? "…"}</DialogTitle>
        </DialogHeader>
        {error && <p className="mt-2 text-sm text-destructive">{error}</p>}
        {!order && !error && (
          <div className="flex justify-center py-8">
            <LoaderCircle className="size-5 animate-spin text-muted-foreground" />
          </div>
        )}
        {order && (
          <div className="mt-3 space-y-4 text-sm">
            <div className="grid grid-cols-2 gap-2 text-muted-foreground">
              <p>
                {t("purchasing.colSupplier")}: <span className="text-foreground">{supplierName}</span>
              </p>
              <p>
                {t("purchasing.colCreated")}: <span className="text-foreground">{formatDate(order.createdAt)}</span>
              </p>
              <p>
                {t("common.status")}:{" "}
                <Badge tone={STATUS_TONE[order.status] ?? "neutral"}>{STATUS_LABEL[order.status] ?? order.status}</Badge>
              </p>
            </div>

            <div>
              <p className="mb-1.5 text-xs font-medium text-muted-foreground uppercase">{t("purchasing.lineItems")}</p>
              <div className="overflow-hidden rounded-md border border-border">
                <table className="w-full text-sm">
                  <tbody>
                    {(order.items ?? []).map((item, i) => (
                      <tr key={i} className="border-b border-border last:border-0">
                        <td className="px-3 py-2">{productNames.get(item.productId) ?? item.productId}</td>
                        <td className="px-3 py-2 text-muted-foreground">{item.quantity}</td>
                        <td className="px-3 py-2 text-right text-muted-foreground">
                          {formatCurrency(Number(item.unitCost))}
                        </td>
                        <td className="px-3 py-2 text-right font-medium text-foreground">
                          {formatCurrency(Number(item.subtotal))}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="space-y-1 border-t border-border pt-3">
              <div className="flex justify-between text-muted-foreground">
                <span>{t("caisse.subtotal")}</span>
                <span>{formatCurrency(Number(order.subtotal))}</span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>{t("caisse.tax")}</span>
                <span>{formatCurrency(Number(order.taxAmount))}</span>
              </div>
              <div className="flex justify-between font-semibold text-foreground">
                <span>{t("purchasing.total")}</span>
                <span>{formatCurrency(Number(order.totalAmount))}</span>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function PurchaseOrderActions({
  status,
  busy,
  onAction,
}: {
  status: string;
  busy: boolean;
  onAction: (action: "submit" | "approve" | "cancel" | "receive") => void;
}) {
  const { t } = useI18n();
  if (busy) return <LoaderCircle className="ml-auto size-4 animate-spin text-muted-foreground" />;
  if (status === "DRAFT")
    return (
      <div className="flex justify-end gap-2">
        <Button size="sm" variant="outline" onClick={() => onAction("cancel")}>
          {t("purchasing.cancel")}
        </Button>
        <Button size="sm" onClick={() => onAction("submit")}>
          {t("purchasing.submit")}
        </Button>
      </div>
    );
  if (status === "SUBMITTED")
    return (
      <div className="flex justify-end gap-2">
        <Button size="sm" variant="outline" onClick={() => onAction("cancel")}>
          {t("purchasing.cancel")}
        </Button>
        <Button size="sm" onClick={() => onAction("approve")}>
          {t("purchasing.approve")}
        </Button>
      </div>
    );
  if (status === "APPROVED")
    return (
      <Button size="sm" onClick={() => onAction("receive")}>
        {t("purchasing.receive")}
      </Button>
    );
  return null;
}

function NewPurchaseOrderForm({
  suppliers,
  storeId,
  onCreated,
}: {
  suppliers: Supplier[];
  storeId: string;
  onCreated: () => void;
}) {
  const { t } = useI18n();
  const [supplierId, setSupplierId] = useState(suppliers[0]?.id ?? "");
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Product[]>([]);
  const [lines, setLines] = useState<Line[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!query) {
      setResults([]);
      return;
    }
    let cancelled = false;
    const timer = setTimeout(async () => {
      try {
        const products = await api.products.search(query);
        if (!cancelled) setResults(products.slice(0, 6));
      } catch {
        /* ignore, recherche best-effort */
      }
    }, 250);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [query]);

  function addLine(product: Product) {
    setLines((prev) =>
      prev.some((l) => l.productId === product.id)
        ? prev
        : [...prev, { productId: product.id, name: product.name, quantity: 1, unitCost: Number(product.costPrice) }],
    );
    setQuery("");
    setResults([]);
  }

  function updateLine(productId: string, patch: Partial<Line>) {
    setLines((prev) => prev.map((l) => (l.productId === productId ? { ...l, ...patch } : l)));
  }

  const total = lines.reduce((sum, l) => sum + l.quantity * l.unitCost, 0);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (lines.length === 0 || !supplierId) return;
    setSubmitting(true);
    setError(null);
    try {
      await api.purchaseOrders.create({
        storeId,
        supplierId,
        items: lines.map((l) => ({ productId: l.productId, quantity: l.quantity, unitCost: l.unitCost })),
      });
      onCreated();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Création impossible");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mt-3 rounded-lg border border-border bg-card p-4">
      <div className="space-y-1.5">
        <Label>{t("purchasing.supplier")}</Label>
        <select
          value={supplierId}
          onChange={(e) => setSupplierId(e.target.value)}
          className="flex h-9 w-full max-w-sm rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
        >
          {suppliers.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
      </div>

      <div className="relative mt-3">
        <Label>{t("purchasing.addProduct")}</Label>
        <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder={t("common.search")} className="mt-1.5 max-w-sm" />
        {results.length > 0 && (
          <div className="absolute z-10 mt-1 w-full max-w-sm overflow-hidden rounded-md border border-border bg-popover shadow-md">
            {results.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => addLine(p)}
                className="flex w-full items-center justify-between px-3 py-2 text-left text-sm hover:bg-secondary"
              >
                <span>{p.name}</span>
                <span className="text-xs text-muted-foreground">{p.sku}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {lines.length > 0 && (
        <div className="mt-4 space-y-2">
          {lines.map((l) => (
            <div key={l.productId} className="grid grid-cols-[1fr_5rem_7rem_auto] items-center gap-2 text-sm">
              <span className="truncate text-foreground">{l.name}</span>
              <Input
                type="number"
                min="0.001"
                value={l.quantity}
                onChange={(e) => updateLine(l.productId, { quantity: Number(e.target.value) })}
                className="h-8"
              />
              <Input
                type="number"
                min="0"
                value={l.unitCost}
                onChange={(e) => updateLine(l.productId, { unitCost: Number(e.target.value) })}
                className="h-8"
              />
              <button
                type="button"
                onClick={() => setLines((prev) => prev.filter((x) => x.productId !== l.productId))}
                className="text-muted-foreground hover:text-destructive"
              >
                <Trash2 className="size-3.5" />
              </button>
            </div>
          ))}
          <p className="pt-1 text-sm font-semibold text-foreground">
            {t("purchasing.total")} : {formatCurrency(total)}
          </p>
        </div>
      )}

      <div className="mt-4 flex items-center gap-2">
        {error && <p className="mr-auto text-sm text-destructive">{error}</p>}
        <Button type="submit" size="sm" disabled={submitting || lines.length === 0 || !supplierId}>
          {submitting && <LoaderCircle className="animate-spin" />}
          {t("purchasing.createOrder")}
        </Button>
      </div>
    </form>
  );
}
