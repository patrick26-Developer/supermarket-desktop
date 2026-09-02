import { ArrowDown, ArrowUp, ArrowUpDown, LoaderCircle, Package, Pencil, Plus, Search, Trash2, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useDefaultStore } from "@/hooks/use-default-store";
import { api, ApiError, type Category, type CreateProductInput, type Product } from "@/lib/api";
import { formatCurrency, slugify } from "@/lib/format";
import { useI18n } from "@/lib/i18n";

type SortKey = "name" | "costPrice" | "taxRate" | "stock";
type SortDir = "asc" | "desc";

export function CataloguePage() {
  const { t } = useI18n();
  const { storeId } = useDefaultStore();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [stockByProduct, setStockByProduct] = useState<Map<string, number>>(new Map());
  const [query, setQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [deleting, setDeleting] = useState<Product | null>(null);
  const [sortKey, setSortKey] = useState<SortKey>("name");
  const [sortDir, setSortDir] = useState<SortDir>("asc");

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

  function toggleSort(key: SortKey) {
    if (key === sortKey) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSortKey(key);
      setSortDir("asc");
    }
  }

  const filtered = useMemo(() => {
    let list = products;
    if (categoryFilter) list = list.filter((p) => p.categoryId === categoryFilter);
    const sorted = [...list].sort((a, b) => {
      let cmp = 0;
      if (sortKey === "name") cmp = a.name.localeCompare(b.name);
      else if (sortKey === "costPrice") cmp = Number(a.costPrice) - Number(b.costPrice);
      else if (sortKey === "taxRate") cmp = Number(a.taxRate) - Number(b.taxRate);
      else if (sortKey === "stock") cmp = (stockByProduct.get(a.id) ?? -1) - (stockByProduct.get(b.id) ?? -1);
      return sortDir === "asc" ? cmp : -cmp;
    });
    return sorted;
  }, [products, categoryFilter, sortKey, sortDir, stockByProduct]);

  async function handleDelete() {
    if (!deleting) return;
    try {
      await api.products.remove(deleting.id);
      setDeleting(null);
      load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Suppression impossible");
      setDeleting(null);
    }
  }

  function SortTh({ label, sortKeyName }: { label: string; sortKeyName: SortKey }) {
    const active = sortKey === sortKeyName;
    return (
      <th className="px-4 py-3 font-medium">
        <button type="button" onClick={() => toggleSort(sortKeyName)} className="flex items-center gap-1 hover:text-foreground">
          {label}
          {active ? sortDir === "asc" ? <ArrowUp className="size-3" /> : <ArrowDown className="size-3" /> : <ArrowUpDown className="size-3 opacity-40" />}
        </button>
      </th>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-10 py-10">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-primary">{t("catalogue.eyebrow")}</p>
          <h1 className="mt-1 text-2xl font-semibold text-foreground">{t("catalogue.title")}</h1>
        </div>
        <Button onClick={() => setShowForm((v) => !v)}>
          {showForm ? <X /> : <Plus />}
          {showForm ? t("common.cancel") : t("catalogue.newProduct")}
        </Button>
      </div>

      {showForm && (
        <ProductForm
          categories={categories}
          storeId={storeId}
          onDone={() => {
            setShowForm(false);
            load();
          }}
        />
      )}

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <div className="relative">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t("catalogue.searchPlaceholder")}
            className="w-64 pl-9"
          />
        </div>
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="flex h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
        >
          <option value="">{t("catalogue.allCategories")}</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      {error && <p className="mt-4 text-sm text-destructive">{error}</p>}

      <div className="mt-4 overflow-hidden rounded-lg border border-border bg-card">
        {loading ? (
          <div className="flex items-center justify-center py-16 text-muted-foreground">
            <LoaderCircle className="size-5 animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-16 text-center text-muted-foreground">
            <Package className="size-8" />
            <p className="text-sm">{t("catalogue.noProducts")}</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs text-muted-foreground uppercase">
                <SortTh label={t("catalogue.colProduct")} sortKeyName="name" />
                <th className="px-4 py-3 font-medium">{t("catalogue.colCategory")}</th>
                <SortTh label={t("catalogue.colCost")} sortKeyName="costPrice" />
                <SortTh label={t("catalogue.colTax")} sortKeyName="taxRate" />
                <SortTh label={t("catalogue.colStock")} sortKeyName="stock" />
                <th className="px-4 py-3 font-medium">{t("common.status")}</th>
                <th className="px-4 py-3 font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => {
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
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-1">
                        <button type="button" onClick={() => setEditing(p)} className="p-1 text-muted-foreground hover:text-primary" aria-label={t("common.edit")}>
                          <Pencil className="size-3.5" />
                        </button>
                        <button type="button" onClick={() => setDeleting(p)} className="p-1 text-muted-foreground hover:text-destructive" aria-label={t("common.delete")}>
                          <Trash2 className="size-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {editing && (
        <ProductForm
          categories={categories}
          storeId={storeId}
          product={editing}
          onDone={() => {
            setEditing(null);
            load();
          }}
          onCancel={() => setEditing(null)}
        />
      )}

      <Dialog open={!!deleting} onOpenChange={(open) => !open && setDeleting(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("catalogue.confirmDeleteProduct")}</DialogTitle>
          </DialogHeader>
          <p className="mt-2 text-sm text-muted-foreground">{deleting?.name}</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleting(null)}>
              {t("common.no")}
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              {t("common.yes")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function ProductForm({
  categories,
  storeId,
  product,
  onDone,
  onCancel,
}: {
  categories: Category[];
  storeId: string | null;
  product?: Product;
  onDone: () => void;
  onCancel?: () => void;
}) {
  const { t } = useI18n();
  const isEdit = !!product;
  const [name, setName] = useState(product?.name ?? "");
  const [sku, setSku] = useState(product?.sku ?? "");
  const [categoryId, setCategoryId] = useState(product?.categoryId ?? "");
  const [costPrice, setCostPrice] = useState(String(product?.costPrice ?? "0"));
  const [taxRate, setTaxRate] = useState(String(product?.taxRate ?? "0"));
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      if (isEdit && product) {
        const patch: Partial<CreateProductInput> = {
          name,
          categoryId: categoryId || undefined,
          costPrice: Number(costPrice),
          taxRate: Number(taxRate),
        };
        await api.products.update(product.id, patch);
      } else {
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
      }
      onDone();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Action impossible");
    } finally {
      setSubmitting(false);
    }
  }

  const formBody = (
    <form onSubmit={handleSubmit} className={isEdit ? "" : "mt-4 grid grid-cols-2 gap-4 rounded-lg border border-border bg-card p-5 sm:grid-cols-4"}>
      <div className={isEdit ? "grid grid-cols-2 gap-4" : "col-span-2"}>
        <div className={isEdit ? "col-span-2 space-y-1.5" : "space-y-1.5"}>
          <Label>{t("common.name")}</Label>
          <Input value={name} onChange={(e) => setName(e.target.value)} required />
        </div>
        {!isEdit && (
          <div className="mt-4 space-y-1.5">
            <Label>{t("catalogue.sku")}</Label>
            <Input value={sku} onChange={(e) => setSku(e.target.value)} required />
          </div>
        )}
        <div className="mt-4 space-y-1.5">
          <Label>{t("catalogue.category")}</Label>
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
        <div className="mt-4 space-y-1.5">
          <Label>{t("catalogue.costPrice")}</Label>
          <Input type="number" min="0" value={costPrice} onChange={(e) => setCostPrice(e.target.value)} />
        </div>
        <div className="mt-4 space-y-1.5">
          <Label>{t("catalogue.taxRate")}</Label>
          <Input type="number" min="0" value={taxRate} onChange={(e) => setTaxRate(e.target.value)} />
        </div>
      </div>
      <div className={isEdit ? "mt-4 flex items-center gap-2" : "col-span-2 flex items-end gap-2 sm:col-span-4"}>
        {error && <p className="mr-auto self-center text-sm text-destructive">{error}</p>}
        <Button type="submit" disabled={submitting || !storeId}>
          {submitting && <LoaderCircle className="animate-spin" />}
          {isEdit ? t("common.save") : t("catalogue.newProduct")}
        </Button>
      </div>
    </form>
  );

  if (!isEdit) return formBody;

  return (
    <Dialog open onOpenChange={(open) => !open && onCancel?.()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{product?.name}</DialogTitle>
        </DialogHeader>
        {formBody}
      </DialogContent>
    </Dialog>
  );
}
