import { LoaderCircle, Package, Receipt, ShoppingBag, TrendingUp } from "lucide-react";
import { useEffect, useState } from "react";

import { useDefaultStore } from "@/hooks/use-default-store";
import { api, ApiError, type SalesSummary, type StockValueReport, type TopProduct } from "@/lib/api";
import { formatCurrency } from "@/lib/format";

export function ReportsPage() {
  const { storeId, loading: storeLoading } = useDefaultStore();
  const [summary, setSummary] = useState<SalesSummary | null>(null);
  const [stockValue, setStockValue] = useState<StockValueReport | null>(null);
  const [topProducts, setTopProducts] = useState<TopProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!storeId) return;
    setLoading(true);
    setError(null);
    Promise.all([
      api.reports.salesSummary(storeId),
      api.reports.stockValue(storeId),
      api.reports.topProducts(storeId),
    ])
      .then(([s, v, t]) => {
        setSummary(s);
        setStockValue(v);
        setTopProducts(t);
      })
      .catch((err) => setError(err instanceof ApiError ? err.message : "Impossible de contacter le serveur"))
      .finally(() => setLoading(false));
  }, [storeId]);

  if (storeLoading || loading) {
    return (
      <div className="flex h-full items-center justify-center text-muted-foreground">
        <LoaderCircle className="size-5 animate-spin" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-10 py-10 pb-16">
      <p className="text-sm font-medium text-primary">Rapports</p>
      <h1 className="mt-1 text-2xl font-semibold text-foreground">Vue d'ensemble</h1>

      {error && <p className="mt-3 text-sm text-destructive">{error}</p>}

      {summary && (
        <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
          <KpiCard icon={Receipt} label="Ventes" value={String(summary.salesCount)} />
          <KpiCard icon={TrendingUp} label="Chiffre d'affaires" value={formatCurrency(summary.totalRevenue)} />
          <KpiCard icon={ShoppingBag} label="Panier moyen" value={formatCurrency(summary.averageBasket)} />
          <KpiCard icon={Package} label="TVA collectée" value={formatCurrency(summary.totalTax)} />
        </div>
      )}

      <section className="mt-10">
        <h2 className="text-base font-semibold text-foreground">Produits les plus vendus</h2>
        <div className="mt-3 overflow-hidden rounded-lg border border-border bg-card">
          {topProducts.length === 0 ? (
            <p className="px-4 py-8 text-center text-sm text-muted-foreground">Aucune vente enregistrée.</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs text-muted-foreground uppercase">
                  <th className="px-4 py-3 font-medium">Produit</th>
                  <th className="px-4 py-3 font-medium">Quantité vendue</th>
                  <th className="px-4 py-3 font-medium">Chiffre d'affaires</th>
                </tr>
              </thead>
              <tbody>
                {topProducts.map((p) => (
                  <tr key={p.productId} className="border-b border-border last:border-0">
                    <td className="px-4 py-3">
                      <p className="font-medium text-foreground">{p.name}</p>
                      <p className="text-xs text-muted-foreground">{p.sku}</p>
                    </td>
                    <td className="px-4 py-3">{p.quantity}</td>
                    <td className="px-4 py-3">{formatCurrency(p.revenue)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </section>

      <section className="mt-10">
        <div className="flex items-baseline justify-between">
          <h2 className="text-base font-semibold text-foreground">Valorisation du stock</h2>
          {stockValue && (
            <p className="text-sm text-muted-foreground">
              Total : <span className="font-semibold text-foreground">{formatCurrency(stockValue.totalValue)}</span>
            </p>
          )}
        </div>
        <div className="mt-3 overflow-hidden rounded-lg border border-border bg-card">
          {!stockValue || stockValue.items.length === 0 ? (
            <p className="px-4 py-8 text-center text-sm text-muted-foreground">Aucun stock.</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs text-muted-foreground uppercase">
                  <th className="px-4 py-3 font-medium">Produit</th>
                  <th className="px-4 py-3 font-medium">Quantité</th>
                  <th className="px-4 py-3 font-medium">Coût unitaire</th>
                  <th className="px-4 py-3 font-medium">Valeur</th>
                </tr>
              </thead>
              <tbody>
                {stockValue.items.map((i) => (
                  <tr key={i.productId} className="border-b border-border last:border-0">
                    <td className="px-4 py-3">
                      <p className="font-medium text-foreground">{i.name ?? "—"}</p>
                      <p className="text-xs text-muted-foreground">{i.sku ?? "—"}</p>
                    </td>
                    <td className="px-4 py-3">{i.quantity}</td>
                    <td className="px-4 py-3">{formatCurrency(i.costPrice)}</td>
                    <td className="px-4 py-3">{formatCurrency(i.value)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </section>
    </div>
  );
}

function KpiCard({ icon: Icon, label, value }: { icon: typeof Receipt; label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <div className="flex size-8 items-center justify-center rounded-md bg-primary/10 text-primary">
        <Icon className="size-4" />
      </div>
      <p className="mt-3 text-lg font-semibold text-foreground">{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
}
