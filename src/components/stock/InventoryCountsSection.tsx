import { ClipboardCheck, LoaderCircle, Plus, Trash2, X } from "lucide-react";
import { useEffect, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { api, ApiError, type InventoryCount, type Product } from "@/lib/api";
import { formatDate } from "@/lib/format";
import { useI18n } from "@/lib/i18n";

const STATUS_TONE: Record<string, "neutral" | "primary" | "success" | "destructive"> = {
  DRAFT: "neutral",
  IN_PROGRESS: "primary",
  COMPLETED: "primary",
  APPROVED: "success",
  CANCELLED: "destructive",
};

const STATUS_LABEL: Record<string, string> = {
  DRAFT: "Brouillon",
  IN_PROGRESS: "En cours",
  COMPLETED: "Complété",
  APPROVED: "Approuvé",
  CANCELLED: "Annulé",
};

interface Line {
  productId: string;
  name: string;
  countedQty: number;
}

interface InventoryCountsSectionProps {
  counts: InventoryCount[];
  storeId: string;
  onChanged: () => void;
  canCreate: boolean;
  canApprove: boolean;
  canCancel: boolean;
}

export function InventoryCountsSection({
  counts,
  storeId,
  onChanged,
  canCreate,
  canApprove,
  canCancel,
}: InventoryCountsSectionProps) {
  const { t } = useI18n();
  const [showForm, setShowForm] = useState(false);
  const [viewingId, setViewingId] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  async function runAction(id: string, action: "approve" | "cancel") {
    setBusyId(id);
    setActionError(null);
    try {
      if (action === "approve" && !window.confirm(t("stock.confirmApprove"))) {
        setBusyId(null);
        return;
      }
      await api.inventoryCounts[action](id);
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
        <h2 className="text-base font-semibold text-foreground">{t("stock.counts")}</h2>
        {canCreate && (
          <Button variant="outline" size="sm" onClick={() => setShowForm((v) => !v)}>
            {showForm ? <X /> : <Plus />}
            {showForm ? t("common.cancel") : t("stock.newCount")}
          </Button>
        )}
      </div>

      {canCreate && showForm && (
        <NewCountForm
          storeId={storeId}
          onCreated={() => {
            setShowForm(false);
            onChanged();
          }}
        />
      )}

      {actionError && <p className="mt-3 text-sm text-destructive">{actionError}</p>}

      <div className="mt-3 overflow-hidden rounded-lg border border-border bg-card">
        {counts.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-12 text-center text-muted-foreground">
            <ClipboardCheck className="size-7" />
            <p className="text-sm">{t("stock.noCounts")}</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs text-muted-foreground uppercase">
                <th className="px-4 py-3 font-medium">{t("purchasing.colReference")}</th>
                <th className="px-4 py-3 font-medium">{t("common.status")}</th>
                <th className="px-4 py-3 font-medium">{t("purchasing.colCreated")}</th>
                <th className="px-4 py-3 font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {counts.map((c) => (
                <tr
                  key={c.id}
                  onClick={() => setViewingId(c.id)}
                  className="cursor-pointer border-b border-border last:border-0 hover:bg-secondary/50"
                >
                  <td className="px-4 py-3 font-medium text-foreground">{c.reference}</td>
                  <td className="px-4 py-3">
                    <Badge tone={STATUS_TONE[c.status] ?? "neutral"}>{STATUS_LABEL[c.status] ?? c.status}</Badge>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{formatDate(c.createdAt)}</td>
                  <td className="px-4 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                    {busyId === c.id ? (
                      <LoaderCircle className="ml-auto size-4 animate-spin text-muted-foreground" />
                    ) : (
                      <div className="flex justify-end gap-2">
                        {canApprove && c.status === "COMPLETED" && (
                          <Button size="sm" onClick={() => runAction(c.id, "approve")}>
                            {t("stock.approve")}
                          </Button>
                        )}
                        {canCancel && c.status !== "APPROVED" && c.status !== "CANCELLED" && (
                          <Button size="sm" variant="outline" onClick={() => runAction(c.id, "cancel")}>
                            {t("purchasing.cancel")}
                          </Button>
                        )}
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {viewingId && <CountDetailsDialog id={viewingId} onClose={() => setViewingId(null)} />}
    </section>
  );
}

function CountDetailsDialog({ id, onClose }: { id: string; onClose: () => void }) {
  const { t } = useI18n();
  const [count, setCount] = useState<InventoryCount | null>(null);
  const [productNames, setProductNames] = useState<Map<string, string>>(new Map());
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([api.inventoryCounts.findOne(id), api.products.search("")])
      .then(([c, products]) => {
        setCount(c);
        setProductNames(new Map(products.map((p) => [p.id, p.name])));
      })
      .catch((err) => setError(err instanceof ApiError ? err.message : "Impossible de charger l'inventaire"));
  }, [id]);

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{count?.reference ?? "…"}</DialogTitle>
        </DialogHeader>
        {error && <p className="mt-2 text-sm text-destructive">{error}</p>}
        {!count && !error && (
          <div className="flex justify-center py-8">
            <LoaderCircle className="size-5 animate-spin text-muted-foreground" />
          </div>
        )}
        {count && (
          <div className="mt-3 space-y-4 text-sm">
            <div className="overflow-hidden rounded-md border border-border">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-xs text-muted-foreground uppercase">
                    <th className="px-3 py-2 font-medium">{t("catalogue.colProduct")}</th>
                    <th className="px-3 py-2 font-medium">{t("stock.colExpected")}</th>
                    <th className="px-3 py-2 font-medium">{t("stock.colCounted")}</th>
                    <th className="px-3 py-2 font-medium">{t("stock.colDifference")}</th>
                  </tr>
                </thead>
                <tbody>
                  {(count.items ?? []).map((item) => {
                    const diff = Number(item.difference);
                    return (
                      <tr key={item.id} className="border-b border-border last:border-0">
                        <td className="px-3 py-2">{productNames.get(item.productId) ?? item.productId}</td>
                        <td className="px-3 py-2 text-muted-foreground">{item.expectedQty}</td>
                        <td className="px-3 py-2 text-muted-foreground">{item.countedQty}</td>
                        <td className={`px-3 py-2 font-medium ${diff === 0 ? "text-muted-foreground" : diff > 0 ? "text-emerald-600" : "text-destructive"}`}>
                          {diff > 0 ? `+${diff}` : diff}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            {count.notes && <p className="text-muted-foreground">{count.notes}</p>}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function NewCountForm({ storeId, onCreated }: { storeId: string; onCreated: () => void }) {
  const { t } = useI18n();
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
      prev.some((l) => l.productId === product.id) ? prev : [...prev, { productId: product.id, name: product.name, countedQty: 0 }],
    );
    setQuery("");
    setResults([]);
  }

  function updateLine(productId: string, patch: Partial<Line>) {
    setLines((prev) => prev.map((l) => (l.productId === productId ? { ...l, ...patch } : l)));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (lines.length === 0) return;
    setSubmitting(true);
    setError(null);
    try {
      await api.inventoryCounts.create({
        storeId,
        items: lines.map((l) => ({ productId: l.productId, countedQty: l.countedQty })),
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
      <div className="relative">
        <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder={t("purchasing.addProduct")} className="max-w-sm" />
        {results.length > 0 && (
          <div className="absolute z-10 mt-1 w-full max-w-sm overflow-hidden rounded-md border-2 border-border bg-popover">
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
            <div key={l.productId} className="grid grid-cols-[1fr_9rem_auto] items-center gap-2 text-sm">
              <span className="truncate text-foreground">{l.name}</span>
              <Input
                type="number"
                min="0"
                placeholder={t("stock.countedQty")}
                value={l.countedQty}
                onChange={(e) => updateLine(l.productId, { countedQty: Number(e.target.value) })}
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
        </div>
      )}

      <div className="mt-4 flex items-center gap-2">
        {error && <p className="mr-auto text-sm text-destructive">{error}</p>}
        <Button type="submit" size="sm" disabled={submitting || lines.length === 0}>
          {submitting && <LoaderCircle className="animate-spin" />}
          {t("stock.createCount")}
        </Button>
      </div>
    </form>
  );
}
