import { Loader2, PackageSearch, Plus, Search } from "lucide-react";
import { useEffect, useState } from "react";

import { Input } from "@/components/ui/input";
import { api, ApiError, type Product } from "@/lib/api";
import { formatCurrency } from "@/lib/format";
import { useI18n } from "@/lib/i18n";

interface ProductSearchProps {
  stockByProduct: Map<string, number>;
  onAdd: (product: Product) => void;
}

export function ProductSearch({ stockByProduct, onAdd }: ProductSearchProps) {
  const { t } = useI18n();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    const timer = setTimeout(async () => {
      try {
        const products = await api.products.search(query);
        if (!cancelled) setResults(products.filter((p) => p.status === "ACTIVE"));
      } catch (err) {
        if (!cancelled) setError(err instanceof ApiError ? err.message : t("common.error"));
      } finally {
        if (!cancelled) setLoading(false);
      }
    }, 250);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [query, t]);

  return (
    <div className="flex h-full flex-col">
      <div className="relative">
        <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t("caisse.searchPlaceholder")}
          className="pl-9"
          autoFocus
        />
        {loading && (
          <Loader2 className="absolute top-1/2 right-3 size-4 -translate-y-1/2 animate-spin text-muted-foreground" />
        )}
      </div>

      {error && <p className="mt-3 text-sm text-destructive">{error}</p>}

      <div className="mt-4 flex-1 space-y-1.5 overflow-y-auto">
        {!loading && results.length === 0 && !error && (
          <div className="flex flex-col items-center justify-center gap-2 py-16 text-center text-muted-foreground">
            <PackageSearch className="size-8" />
            <p className="text-sm">{query ? t("caisse.noResults") : t("caisse.typeToSearch")}</p>
          </div>
        )}

        {results.map((product) => {
          const available = stockByProduct.get(product.id);
          const outOfStock = available !== undefined && available <= 0;
          return (
            <button
              key={product.id}
              type="button"
              disabled={outOfStock}
              onClick={() => onAdd(product)}
              className="flex w-full items-center gap-3 rounded-lg border border-border bg-card px-4 py-3 text-left transition-colors hover:border-primary/40 hover:bg-secondary disabled:cursor-not-allowed disabled:opacity-50"
            >
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-foreground">{product.name}</p>
                <p className="text-xs text-muted-foreground">
                  {product.sku}
                  {available !== undefined && (
                    <span className={outOfStock ? "text-destructive" : ""}>
                      {" "}
                      · {outOfStock ? t("catalogue.outOfStock") : `${available}`}
                    </span>
                  )}
                </p>
              </div>
              <span className="shrink-0 text-sm text-muted-foreground">
                {formatCurrency(Number(product.costPrice))}
              </span>
              <Plus className="size-4 shrink-0 text-primary" />
            </button>
          );
        })}
      </div>
    </div>
  );
}
