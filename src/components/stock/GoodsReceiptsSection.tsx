import { LoaderCircle, Package, Plus, Trash2, X } from "lucide-react";
import { useEffect, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { api, ApiError, type GoodsReceipt, type Product } from "@/lib/api";
import { formatCurrency, formatDate } from "@/lib/format";
import { useI18n } from "@/lib/i18n";

const STATUS_TONE: Record<string, "neutral" | "primary" | "success" | "destructive"> = {
  DRAFT: "neutral",
  RECEIVED: "success",
  CANCELLED: "destructive",
};

const STATUS_LABEL: Record<string, string> = {
  DRAFT: "Brouillon",
  RECEIVED: "Reçue",
  CANCELLED: "Annulée",
};

interface Line {
  productId: string;
  name: string;
  quantity: number;
  unitCost: number;
}

interface GoodsReceiptsSectionProps {
  receipts: GoodsReceipt[];
  storeId: string;
  onChanged: () => void;
  canCreate: boolean;
}

export function GoodsReceiptsSection({ receipts, storeId, onChanged, canCreate }: GoodsReceiptsSectionProps) {
  const { t } = useI18n();
  const [showForm, setShowForm] = useState(false);
  const [viewingId, setViewingId] = useState<string | null>(null);

  return (
    <section>
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold text-foreground">{t("stock.receipts")}</h2>
        {canCreate && (
          <Button variant="outline" size="sm" onClick={() => setShowForm((v) => !v)}>
            {showForm ? <X /> : <Plus />}
            {showForm ? t("common.cancel") : t("common.new")}
          </Button>
        )}
      </div>

      {canCreate && showForm && (
        <NewReceiptForm
          storeId={storeId}
          onCreated={() => {
            setShowForm(false);
            onChanged();
          }}
        />
      )}

      <div className="mt-3 overflow-hidden rounded-lg border border-border bg-card">
        {receipts.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-12 text-center text-muted-foreground">
            <Package className="size-7" />
            <p className="text-sm">{t("stock.noReceipts")}</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs text-muted-foreground uppercase">
                <th className="px-4 py-3 font-medium">{t("purchasing.colReference")}</th>
                <th className="px-4 py-3 font-medium">{t("common.status")}</th>
                <th className="px-4 py-3 font-medium">{t("stock.colReceivedAt")}</th>
              </tr>
            </thead>
            <tbody>
              {receipts.map((r) => (
                <tr
                  key={r.id}
                  onClick={() => setViewingId(r.id)}
                  className="cursor-pointer border-b border-border last:border-0 hover:bg-secondary/50"
                >
                  <td className="px-4 py-3 font-medium text-foreground">{r.reference}</td>
                  <td className="px-4 py-3">
                    <Badge tone={STATUS_TONE[r.status] ?? "neutral"}>{STATUS_LABEL[r.status] ?? r.status}</Badge>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{r.receivedAt ? formatDate(r.receivedAt) : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {viewingId && <ReceiptDetailsDialog id={viewingId} onClose={() => setViewingId(null)} />}
    </section>
  );
}

function ReceiptDetailsDialog({ id, onClose }: { id: string; onClose: () => void }) {
  const { t } = useI18n();
  const [receipt, setReceipt] = useState<GoodsReceipt | null>(null);
  const [productNames, setProductNames] = useState<Map<string, string>>(new Map());
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([api.goodsReceipts.findOne(id), api.products.search("")])
      .then(([r, products]) => {
        setReceipt(r);
        setProductNames(new Map(products.map((p) => [p.id, p.name])));
      })
      .catch((err) => setError(err instanceof ApiError ? err.message : "Impossible de charger la réception"));
  }, [id]);

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{receipt?.reference ?? "…"}</DialogTitle>
        </DialogHeader>
        {error && <p className="mt-2 text-sm text-destructive">{error}</p>}
        {!receipt && !error && (
          <div className="flex justify-center py-8">
            <LoaderCircle className="size-5 animate-spin text-muted-foreground" />
          </div>
        )}
        {receipt && (
          <div className="mt-3 space-y-4 text-sm">
            <div className="overflow-hidden rounded-md border border-border">
              <table className="w-full text-sm">
                <tbody>
                  {(receipt.items ?? []).map((item) => (
                    <tr key={item.id} className="border-b border-border last:border-0">
                      <td className="px-3 py-2">{productNames.get(item.productId) ?? item.productId}</td>
                      <td className="px-3 py-2 text-muted-foreground">{item.quantity}</td>
                      <td className="px-3 py-2 text-right text-muted-foreground">{formatCurrency(Number(item.unitCost))}</td>
                      <td className="px-3 py-2 text-right font-medium text-foreground">{formatCurrency(Number(item.subtotal))}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {receipt.notes && <p className="text-muted-foreground">{receipt.notes}</p>}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function NewReceiptForm({ storeId, onCreated }: { storeId: string; onCreated: () => void }) {
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
    if (lines.length === 0) return;
    setSubmitting(true);
    setError(null);
    try {
      await api.goodsReceipts.create({
        storeId,
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
        <Button type="submit" size="sm" disabled={submitting || lines.length === 0}>
          {submitting && <LoaderCircle className="animate-spin" />}
          {t("common.create")}
        </Button>
      </div>
    </form>
  );
}
