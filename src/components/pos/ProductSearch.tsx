import { Loader2, PackageSearch, Search } from "lucide-react";
import { useEffect, useState } from "react";

import { ProductAvatar } from "@/components/catalogue/ProductAvatar";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { api, ApiError, type Product } from "@/lib/api";
import { formatCurrency } from "@/lib/format";
import { useI18n } from "@/lib/i18n";

interface ProductSearchProps {
  stockByProduct: Map<string, number>;
  categoryById: Map<string, string>;
  onAdd: (product: Product) => void;
}

/**
 * Grille de tuiles produit (comme un clavier de caisse tactile) plutôt qu'une
 * simple liste — chaque tuile porte l'image du produit (ou son icône de
 * catégorie), pour repérer un article au clin d'œil pendant l'encaissement.
 */
export function ProductSearch({ stockByProduct, categoryById, onAdd }: ProductSearchProps) {
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

      <div className="mt-4 flex-1 overflow-y-auto">
        {!loading && results.length === 0 && !error && (
          <div className="flex flex-col items-center justify-center gap-2 py-16 text-center text-muted-foreground">
            <PackageSearch className="size-8" />
            <p className="text-sm">{query ? t("caisse.noResults") : t("caisse.typeToSearch")}</p>
          </div>
        )}

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {results.map((product) => {
            const available = stockByProduct.get(product.id);
            const outOfStock = available !== undefined && available <= 0;
            const categoryName = categoryById.get(product.categoryId ?? "");
            return (
              <button
                key={product.id}
                type="button"
                disabled={outOfStock}
                onClick={() => onAdd(product)}
                className="flex flex-col items-center gap-2 rounded-lg border border-border bg-card p-3 text-center transition-colors hover:border-primary/40 hover:bg-secondary disabled:cursor-not-allowed disabled:opacity-50"
              >
                <ProductAvatar imageUrl={product.imageUrl} name={product.name} categoryName={categoryName} size="lg" />
                <p className="line-clamp-2 text-xs font-medium text-foreground">{product.name}</p>
                <span className="text-sm font-semibold text-primary">{formatCurrency(Number(product.costPrice))}</span>
                {available !== undefined && (
                  <Badge tone={outOfStock ? "destructive" : "neutral"}>
                    {outOfStock ? t("catalogue.outOfStock") : `${available}`}
                  </Badge>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
