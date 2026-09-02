import { LoaderCircle, Package, Plus, Search, X } from "lucide-react";
import { useEffect, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useDefaultStore } from "@/hooks/use-default-store";
import { api, ApiError, type Category, type Product } from "@/lib/api";
import { formatCurrency, slugify } from "@/lib/format";

export function CataloguePage() {
  const { storeId } = useDefaultStore();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [stockByProduct, setStockByProduct] = useState<Map<string, number>>(new Map());
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const [productList, categoryList] = await Promise.all([
        api.products.search(query),
        api.categories.list(),
      ]);
      setProducts(productList);
      setCategories(categoryList);
      if (storeId) {
        const stock = await api.stock.listByStore(storeId);
        setStockByProduct(new Map(stock.map((s) => [s.productId, Number(s.availableQty)])));
      }
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Impossible de contacter le serveur");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const timer = setTimeout(load, 250);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, storeId]);

  const categoryById = new Map(categories.map((c) => [c.id, c.name]));

  return (
    <div className="mx-auto max-w-5xl px-10 py-10">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-primary">Catalogue & stock</p>
          <h1 className="mt-1 text-2xl font-semibold text-foreground">Produits</h1>
        </div>
        <Button onClick={() => setShowForm((v) => !v)}>
          {showForm ? <X /> : <Plus />}
          {showForm ? "Annuler" : "Nouveau produit"}
        </Button>
      </div>

      {showForm && (
        <NewProductForm
          categories={categories}
          storeId={storeId}
          onCreated={() => {
            setShowForm(false);
            load();
          }}
        />
      )}

      <div className="relative mt-6">
        <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Rechercher un produit…"
          className="max-w-sm pl-9"
        />
      </div>

      {error && <p className="mt-4 text-sm text-destructive">{error}</p>}

      <div className="mt-4 overflow-hidden rounded-lg border border-border bg-card">
        {loading ? (
          <div className="flex items-center justify-center py-16 text-muted-foreground">
            <LoaderCircle className="size-5 animate-spin" />
          </div>
        ) : products.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-16 text-center text-muted-foreground">
            <Package className="size-8" />
            <p className="text-sm">Aucun produit.</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs text-muted-foreground uppercase">
                <th className="px-4 py-3 font-medium">Produit</th>
                <th className="px-4 py-3 font-medium">Catégorie</th>
                <th className="px-4 py-3 font-medium">Coût</th>
                <th className="px-4 py-3 font-medium">TVA</th>
                <th className="px-4 py-3 font-medium">Stock</th>
                <th className="px-4 py-3 font-medium">Statut</th>
              </tr>
            </thead>
            <tbody>
              {products.map((p) => {
                const stock = stockByProduct.get(p.id);
                return (
                  <tr key={p.id} className="border-b border-border last:border-0">
                    <td className="px-4 py-3">
                      <p className="font-medium text-foreground">{p.name}</p>
                      <p className="text-xs text-muted-foreground">{p.sku}</p>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {categoryById.get(p.categoryId ?? "") ?? "—"}
                    </td>
                    <td className="px-4 py-3">{formatCurrency(Number(p.costPrice))}</td>
                    <td className="px-4 py-3 text-muted-foreground">{Number(p.taxRate)}%</td>
                    <td className="px-4 py-3">
                      {stock === undefined ? (
                        "—"
                      ) : (
                        <span className={stock <= 0 ? "text-destructive" : ""}>{stock}</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <Badge tone={p.status === "ACTIVE" ? "success" : "neutral"}>{p.status}</Badge>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

function NewProductForm({
  categories,
  storeId,
  onCreated,
}: {
  categories: Category[];
  storeId: string | null;
  onCreated: () => void;
}) {
  const [name, setName] = useState("");
  const [sku, setSku] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [costPrice, setCostPrice] = useState("0");
  const [taxRate, setTaxRate] = useState("0");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await api.products.create({
        sku,
        name,
        slug: slugify(name),
        categoryId: categoryId || undefined,
        costPrice: Number(costPrice),
        taxRate: Number(taxRate),
        reorderLevel: 0,
        minimumStock: 0,
      });
      onCreated();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Création impossible");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="mt-4 grid grid-cols-2 gap-4 rounded-lg border border-border bg-card p-5 sm:grid-cols-4"
    >
      <div className="col-span-2 space-y-1.5">
        <Label>Nom</Label>
        <Input value={name} onChange={(e) => setName(e.target.value)} required />
      </div>
      <div className="space-y-1.5">
        <Label>SKU</Label>
        <Input value={sku} onChange={(e) => setSku(e.target.value)} required />
      </div>
      <div className="space-y-1.5">
        <Label>Catégorie</Label>
        <select
          value={categoryId}
          onChange={(e) => setCategoryId(e.target.value)}
          className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
        >
          <option value="">—</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>
      <div className="space-y-1.5">
        <Label>Prix de revient</Label>
        <Input type="number" min="0" value={costPrice} onChange={(e) => setCostPrice(e.target.value)} />
      </div>
      <div className="space-y-1.5">
        <Label>TVA (%)</Label>
        <Input type="number" min="0" value={taxRate} onChange={(e) => setTaxRate(e.target.value)} />
      </div>
      <div className="col-span-2 flex items-end gap-2 sm:col-span-4">
        {error && <p className="mr-auto self-center text-sm text-destructive">{error}</p>}
        <Button type="submit" disabled={submitting || !storeId}>
          {submitting && <LoaderCircle className="animate-spin" />}
          Créer le produit
        </Button>
      </div>
    </form>
  );
}
