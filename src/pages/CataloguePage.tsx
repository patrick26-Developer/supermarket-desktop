import { ArrowDownAZ, ArrowUpAZ, LoaderCircle, Package, Pencil, Plus, Search, Trash2, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { CategoriesSection } from "@/components/catalogue/CategoriesSection";
import { ImageUploadField } from "@/components/catalogue/ImageUploadField";
import { ProductAvatar } from "@/components/catalogue/ProductAvatar";
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
import { tonePillClasses } from "@/lib/category-colors";
import { formatCurrency, slugify } from "@/lib/format";
import { useI18n } from "@/lib/i18n";

type SortKey = "name" | "costPrice" | "stock";
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

  const filteredAndSorted = useMemo(() => {
    let list = products;
    if (categoryFilter) list = list.filter((p) => p.categoryId === categoryFilter);
    return [...list].sort((a, b) => {
      let cmp = 0;
      if (sortKey === "name") cmp = a.name.localeCompare(b.name);
      else if (sortKey === "costPrice") cmp = Number(a.costPrice) - Number(b.costPrice);
      else if (sortKey === "stock") cmp = (stockByProduct.get(a.id) ?? -1) - (stockByProduct.get(b.id) ?? -1);
      return sortDir === "asc" ? cmp : -cmp;
    });
  }, [products, categoryFilter, sortKey, sortDir, stockByProduct]);

  // Regroupement par catégorie, dans l'ordre de la liste des catégories —
  // "bien structuré" plutôt qu'un tableau plat : chaque section est une
  // catégorie précise, avec ses propres produits en grille.
  const grouped = useMemo(() => {
    const byCategory = new Map<string, Product[]>();
    for (const p of filteredAndSorted) {
      const key = p.categoryId ?? "__none__";
      if (!byCategory.has(key)) byCategory.set(key, []);
      byCategory.get(key)!.push(p);
    }
    const sections: { id: string; name: string; products: Product[] }[] = [];
    for (const c of categories) {
      if (byCategory.has(c.id)) sections.push({ id: c.id, name: c.name, products: byCategory.get(c.id)! });
    }
    if (byCategory.has("__none__")) {
      sections.push({ id: "__none__", name: t("catalogue.uncategorized"), products: byCategory.get("__none__")! });
    }
    return sections;
  }, [filteredAndSorted, categories, t]);

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

  return (
    <div className="mx-auto max-w-7xl px-10 py-10">
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

      <CategoriesSection categories={categories} onChanged={load} />

      <div className="mt-8 flex flex-wrap items-center gap-3">
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
          className="flex h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
        >
          <option value="">{t("catalogue.allCategories")}</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>

        <div className="ml-auto flex items-center gap-1.5">
          <span className="text-xs text-muted-foreground">{t("catalogue.sortBy")}</span>
          <select
            value={sortKey}
            onChange={(e) => setSortKey(e.target.value as SortKey)}
            className="flex h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
          >
            <option value="name">{t("catalogue.sortName")}</option>
            <option value="costPrice">{t("catalogue.sortPrice")}</option>
            <option value="stock">{t("catalogue.sortStock")}</option>
          </select>
          <button
            type="button"
            onClick={() => setSortDir((d) => (d === "asc" ? "desc" : "asc"))}
            className="flex size-9 items-center justify-center rounded-md border border-input text-muted-foreground transition-colors hover:text-foreground"
            aria-label={sortDir === "asc" ? "Croissant" : "Décroissant"}
          >
            {sortDir === "asc" ? <ArrowUpAZ className="size-4" /> : <ArrowDownAZ className="size-4" />}
          </button>
        </div>
      </div>

      {error && <p className="mt-4 text-sm text-destructive">{error}</p>}

      {loading ? (
        <div className="mt-10 flex items-center justify-center py-16 text-muted-foreground">
          <LoaderCircle className="size-5 animate-spin" />
        </div>
      ) : filteredAndSorted.length === 0 ? (
        <div className="mt-10 flex flex-col items-center gap-2 rounded-lg border border-dashed border-border py-16 text-center text-muted-foreground">
          <Package className="size-8" />
          <p className="text-sm">{t("catalogue.noProducts")}</p>
        </div>
      ) : (
        <div className="mt-8 space-y-10">
          {grouped.map((section) => (
            <section key={section.id}>
              <div className="mb-3 flex items-center gap-2.5">
                <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${tonePillClasses(section.name)}`}>
                  {section.name}
                </span>
                <span className="text-xs text-muted-foreground">
                  {section.products.length} {t("catalogue.productsCount")}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                {section.products.map((p) => {
                  const stock = stockByProduct.get(p.id);
                  const outOfStock = stock !== undefined && stock <= 0;
                  return (
                    <div
                      key={p.id}
                      onClick={() => setEditing(p)}
                      className="group flex cursor-pointer flex-col gap-3 rounded-lg border border-border bg-card p-4 transition-colors hover:border-primary/40 hover:bg-secondary/30"
                    >
                      <div className="flex items-start justify-between">
                        <ProductAvatar imageUrl={p.imageUrl} name={p.name} categoryName={section.name} size="lg" />
                        <div
                          className="flex gap-0.5 opacity-0 transition-opacity group-hover:opacity-100"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <button type="button" onClick={() => setEditing(p)} className="p-1 text-muted-foreground hover:text-primary" aria-label={t("common.details")}>
                            <Pencil className="size-3.5" />
                          </button>
                          <button type="button" onClick={() => setDeleting(p)} className="p-1 text-muted-foreground hover:text-destructive" aria-label={t("common.delete")}>
                            <Trash2 className="size-3.5" />
                          </button>
                        </div>
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-foreground">{p.name}</p>
                        <p className="text-xs text-muted-foreground">{p.sku}</p>
                        {p.description && (
                          <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{p.description}</p>
                        )}
                      </div>
                      <div className="mt-auto flex items-center justify-between gap-2">
                        <span className="text-sm font-semibold text-foreground">
                          {formatCurrency(Number(p.costPrice))}
                        </span>
                        <div className="flex items-center gap-1">
                          {stock !== undefined && (
                            <Badge tone={outOfStock ? "destructive" : "neutral"}>
                              {outOfStock ? t("catalogue.outOfStock") : stock}
                            </Badge>
                          )}
                          <Badge tone={p.status === "ACTIVE" ? "success" : "neutral"}>{p.status}</Badge>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      )}

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
  const [description, setDescription] = useState(product?.description ?? "");
  const [categoryId, setCategoryId] = useState(product?.categoryId ?? "");
  const [costPrice, setCostPrice] = useState(String(product?.costPrice ?? "0"));
  const [taxRate, setTaxRate] = useState(String(product?.taxRate ?? "0"));
  const [reorderLevel, setReorderLevel] = useState(String(product?.reorderLevel ?? "0"));
  const [minimumStock, setMinimumStock] = useState(String(product?.minimumStock ?? "0"));
  const [imageUrl, setImageUrl] = useState(product?.imageUrl ?? "");
  const [status, setStatus] = useState(product?.status ?? "ACTIVE");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const categoryName = categories.find((c) => c.id === categoryId)?.name;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      if (isEdit && product) {
        const patch: Partial<CreateProductInput> = {
          name,
          description: description || undefined,
          categoryId: categoryId || undefined,
          costPrice: Number(costPrice),
          taxRate: Number(taxRate),
          reorderLevel: Number(reorderLevel),
          minimumStock: Number(minimumStock),
          imageUrl: imageUrl || undefined,
          status,
        };
        await api.products.update(product.id, patch);
      } else {
        await api.products.create({
          sku,
          name,
          slug: slugify(name),
          description: description || undefined,
          categoryId: categoryId || undefined,
          costPrice: Number(costPrice),
          taxRate: Number(taxRate),
          reorderLevel: Number(reorderLevel),
          minimumStock: Number(minimumStock),
          imageUrl: imageUrl || undefined,
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
    <form onSubmit={handleSubmit} className={isEdit ? "" : "mt-4 rounded-lg border border-border bg-card p-5"}>
      <div className="mb-4">
        <Label>{t("catalogue.image")}</Label>
        <div className="mt-1.5">
          <ImageUploadField value={imageUrl} onChange={setImageUrl} name={name || "?"} categoryName={categoryName} />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="col-span-2 space-y-1.5">
          <Label>{t("common.name")}</Label>
          <Input value={name} onChange={(e) => setName(e.target.value)} required />
        </div>
        {!isEdit && (
          <div className="space-y-1.5">
            <Label>{t("catalogue.sku")}</Label>
            <Input value={sku} onChange={(e) => setSku(e.target.value)} required />
          </div>
        )}
        <div className="space-y-1.5">
          <Label>{t("catalogue.category")}</Label>
          <select
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
          >
            <option value="">—</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
        <div className="col-span-2 space-y-1.5 sm:col-span-4">
          <Label>{t("catalogue.description")}</Label>
          <Input value={description} onChange={(e) => setDescription(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label>{t("catalogue.costPrice")}</Label>
          <Input type="number" min="0" value={costPrice} onChange={(e) => setCostPrice(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label>{t("catalogue.taxRate")}</Label>
          <Input type="number" min="0" value={taxRate} onChange={(e) => setTaxRate(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label>{t("catalogue.reorderLevel")}</Label>
          <Input type="number" min="0" value={reorderLevel} onChange={(e) => setReorderLevel(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label>{t("catalogue.minimumStock")}</Label>
          <Input type="number" min="0" value={minimumStock} onChange={(e) => setMinimumStock(e.target.value)} />
        </div>
        {isEdit && (
          <div className="space-y-1.5">
            <Label>{t("common.status")}</Label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
            >
              <option value="ACTIVE">ACTIVE</option>
              <option value="INACTIVE">INACTIVE</option>
              <option value="DISCONTINUED">DISCONTINUED</option>
              <option value="ARCHIVED">ARCHIVED</option>
            </select>
          </div>
        )}
      </div>
      <div className="mt-4 flex items-center gap-2">
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
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{product?.name}</DialogTitle>
        </DialogHeader>
        {formBody}
      </DialogContent>
    </Dialog>
  );
}
