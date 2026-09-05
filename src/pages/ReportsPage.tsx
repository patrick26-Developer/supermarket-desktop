import { ArrowDown, ArrowUp, ArrowUpDown, LoaderCircle, Package, Receipt, ShoppingBag, TrendingUp } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { RevenueTrendChart, StockValuePieChart, TopProductsBarChart } from "@/components/reports/Charts";
import { useDefaultStore } from "@/hooks/use-default-store";
import {
  api,
  ApiError,
  type Sale,
  type SalesSummary,
  type StockValueItem,
  type StockValueReport,
  type TopProduct,
} from "@/lib/api";
import { formatCurrency } from "@/lib/format";
import { useI18n } from "@/lib/i18n";

type SortDir = "asc" | "desc";

function useSort<T>(items: T[], defaultKey: keyof T, defaultDir: SortDir = "desc") {
  const [key, setKey] = useState<keyof T>(defaultKey);
  const [dir, setDir] = useState<SortDir>(defaultDir);

  function toggle(k: keyof T) {
    if (k === key) setDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setKey(k);
      setDir("desc");
    }
  }

  const sorted = useMemo(() => {
    return [...items].sort((a, b) => {
      const av = a[key];
      const bv = b[key];
      const cmp = typeof av === "number" && typeof bv === "number" ? av - bv : String(av).localeCompare(String(bv));
      return dir === "asc" ? cmp : -cmp;
    });
  }, [items, key, dir]);

  return { sorted, key, dir, toggle };
}

function SortHeader<T>({
  label,
  column,
  active,
  dir,
  onClick,
}: {
  label: string;
  column: keyof T;
  active: boolean;
  dir: SortDir;
  onClick: (c: keyof T) => void;
}) {
  return (
    <th className="px-4 py-3 font-medium">
      <button type="button" onClick={() => onClick(column)} className="flex items-center gap-1 hover:text-foreground">
        {label}
        {active ? dir === "asc" ? <ArrowUp className="size-3" /> : <ArrowDown className="size-3" /> : <ArrowUpDown className="size-3 opacity-40" />}
      </button>
    </th>
  );
}

function groupRevenueByDay(sales: Sale[]) {
  const byDay = new Map<string, number>();
  for (const s of sales) {
    const day = s.soldAt.slice(0, 10);
    byDay.set(day, (byDay.get(day) ?? 0) + Number(s.totalAmount));
  }
  return [...byDay.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([day, revenue]) => ({
      label: new Date(day).toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit" }),
      revenue,
    }));
}

export function ReportsPage() {
  const { t } = useI18n();
  const { storeId, loading: storeLoading } = useDefaultStore();
  const [summary, setSummary] = useState<SalesSummary | null>(null);
  const [stockValue, setStockValue] = useState<StockValueReport | null>(null);
  const [topProducts, setTopProducts] = useState<TopProduct[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!storeId) {
      // storeId ne se résout jamais pour un rôle sans CASH_REGISTERS:READ
      // (Comptable, Responsable ventes…) — voir useDefaultStore.
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    Promise.all([
      api.reports.salesSummary(storeId),
      api.reports.stockValue(storeId),
      api.reports.topProducts(storeId),
      api.sales.list(storeId),
    ])
      .then(([s, v, tp, sl]) => {
        setSummary(s);
        setStockValue(v);
        setTopProducts(tp);
        setSales(sl);
      })
      .catch((err) => setError(err instanceof ApiError ? err.message : "Impossible de contacter le serveur"))
      .finally(() => setLoading(false));
  }, [storeId]);

  const topProductsSort = useSort(topProducts, "revenue");
  const stockValueSort = useSort(stockValue?.items ?? [], "value");
  const revenueTrend = useMemo(() => groupRevenueByDay(sales), [sales]);
  const stockPieData = useMemo(() => {
    const items = [...(stockValue?.items ?? [])].sort((a, b) => b.value - a.value);
    const top = items.slice(0, 5).map((i) => ({ name: i.name ?? "—", value: i.value }));
    const rest = items.slice(5).reduce((sum, i) => sum + i.value, 0);
    if (rest > 0) top.push({ name: t("reports.others"), value: rest });
    return top;
  }, [stockValue, t]);

  if (storeLoading || loading) {
    return (
      <div className="flex h-full items-center justify-center text-muted-foreground">
        <LoaderCircle className="size-5 animate-spin" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-10 py-10 pb-16">
      <p className="text-sm font-medium text-primary">{t("reports.eyebrow")}</p>
      <h1 className="mt-1 text-2xl font-semibold text-foreground">{t("reports.title")}</h1>

      {error && <p className="mt-3 text-sm text-destructive">{error}</p>}

      {summary && (
        <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
          <KpiCard icon={Receipt} label={t("reports.sales")} value={String(summary.salesCount)} />
          <KpiCard icon={TrendingUp} label={t("reports.revenue")} value={formatCurrency(summary.totalRevenue)} />
          <KpiCard icon={ShoppingBag} label={t("reports.avgBasket")} value={formatCurrency(summary.averageBasket)} />
          <KpiCard icon={Package} label={t("reports.taxCollected")} value={formatCurrency(summary.totalTax)} />
        </div>
      )}

      <div className="mt-10 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <section className="rounded-lg border border-border bg-card p-5">
          <h2 className="text-sm font-semibold text-foreground">{t("reports.revenueTrend")}</h2>
          {revenueTrend.length === 0 ? (
            <p className="py-16 text-center text-sm text-muted-foreground">{t("reports.noSales")}</p>
          ) : (
            <RevenueTrendChart data={revenueTrend} />
          )}
        </section>

        <section className="rounded-lg border border-border bg-card p-5">
          <h2 className="text-sm font-semibold text-foreground">{t("reports.topProducts")}</h2>
          {topProducts.length === 0 ? (
            <p className="py-16 text-center text-sm text-muted-foreground">{t("reports.noSales")}</p>
          ) : (
            <TopProductsBarChart data={topProducts.slice(0, 6).map((p) => ({ name: p.name, revenue: p.revenue }))} />
          )}
        </section>
      </div>

      <section className="mt-6 rounded-lg border border-border bg-card p-5">
        <h2 className="text-sm font-semibold text-foreground">{t("reports.stockShare")}</h2>
        {stockPieData.length === 0 ? (
          <p className="py-16 text-center text-sm text-muted-foreground">{t("reports.noStock")}</p>
        ) : (
          <StockValuePieChart data={stockPieData} />
        )}
      </section>

      <section className="mt-10">
        <h2 className="text-base font-semibold text-foreground">{t("reports.topProducts")}</h2>
        <div className="mt-3 overflow-hidden rounded-lg border border-border bg-card">
          {topProducts.length === 0 ? (
            <p className="px-4 py-8 text-center text-sm text-muted-foreground">{t("reports.noSales")}</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs text-muted-foreground uppercase">
                  <SortHeader label={t("reports.colProduct")} column="name" active={topProductsSort.key === "name"} dir={topProductsSort.dir} onClick={topProductsSort.toggle} />
                  <SortHeader label={t("reports.colQtySold")} column="quantity" active={topProductsSort.key === "quantity"} dir={topProductsSort.dir} onClick={topProductsSort.toggle} />
                  <SortHeader label={t("reports.colRevenue")} column="revenue" active={topProductsSort.key === "revenue"} dir={topProductsSort.dir} onClick={topProductsSort.toggle} />
                </tr>
              </thead>
              <tbody>
                {topProductsSort.sorted.map((p) => (
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
          <h2 className="text-base font-semibold text-foreground">{t("reports.stockValuation")}</h2>
          {stockValue && (
            <p className="text-sm text-muted-foreground">
              {t("reports.total")} :{" "}
              <span className="font-semibold text-foreground">{formatCurrency(stockValue.totalValue)}</span>
            </p>
          )}
        </div>
        <div className="mt-3 overflow-hidden rounded-lg border border-border bg-card">
          {!stockValue || stockValue.items.length === 0 ? (
            <p className="px-4 py-8 text-center text-sm text-muted-foreground">{t("reports.noStock")}</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs text-muted-foreground uppercase">
                  <SortHeader<StockValueItem> label={t("reports.colProduct")} column="name" active={stockValueSort.key === "name"} dir={stockValueSort.dir} onClick={stockValueSort.toggle} />
                  <SortHeader<StockValueItem> label={t("reports.colQty")} column="quantity" active={stockValueSort.key === "quantity"} dir={stockValueSort.dir} onClick={stockValueSort.toggle} />
                  <SortHeader<StockValueItem> label={t("reports.colUnitCost")} column="costPrice" active={stockValueSort.key === "costPrice"} dir={stockValueSort.dir} onClick={stockValueSort.toggle} />
                  <SortHeader<StockValueItem> label={t("reports.colValue")} column="value" active={stockValueSort.key === "value"} dir={stockValueSort.dir} onClick={stockValueSort.toggle} />
                </tr>
              </thead>
              <tbody>
                {stockValueSort.sorted.map((i) => (
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
