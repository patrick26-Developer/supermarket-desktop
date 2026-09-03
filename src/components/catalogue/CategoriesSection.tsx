import { LoaderCircle, Pencil, Plus, Tag, Trash2, X } from "lucide-react";
import { useState } from "react";

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
import { api, ApiError, type Category } from "@/lib/api";
import { slugify } from "@/lib/format";
import { useI18n } from "@/lib/i18n";

interface CategoriesSectionProps {
  categories: Category[];
  onChanged: () => void;
}

export function CategoriesSection({ categories, onChanged }: CategoriesSectionProps) {
  const { t } = useI18n();
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);
  const [deleting, setDeleting] = useState<Category | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  async function handleDelete() {
    if (!deleting) return;
    setDeleteError(null);
    try {
      await api.categories.remove(deleting.id);
      setDeleting(null);
      onChanged();
    } catch (err) {
      setDeleteError(err instanceof ApiError ? err.message : "Suppression impossible");
    }
  }

  return (
    <section className="mt-8">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-foreground">{t("catalogue.categories")}</h2>
        <Button variant="outline" size="sm" onClick={() => setShowForm((v) => !v)}>
          {showForm ? <X className="size-3.5" /> : <Plus className="size-3.5" />}
          {showForm ? t("common.cancel") : t("catalogue.newCategory")}
        </Button>
      </div>

      {showForm && (
        <CategoryForm
          onDone={() => {
            setShowForm(false);
            onChanged();
          }}
        />
      )}

      <div className="mt-3 flex flex-wrap gap-2">
        {categories.length === 0 && (
          <p className="flex items-center gap-2 text-sm text-muted-foreground">
            <Tag className="size-4" /> {t("catalogue.noCategories")}
          </p>
        )}
        {categories.map((c) => (
          <div
            key={c.id}
            className="flex items-center gap-1.5 rounded-full border border-border bg-card py-1 pr-1.5 pl-3 text-sm"
          >
            <span>{c.name}</span>
            <button type="button" onClick={() => setEditing(c)} className="p-1 text-muted-foreground hover:text-primary" aria-label={t("common.edit")}>
              <Pencil className="size-3" />
            </button>
            <button type="button" onClick={() => setDeleting(c)} className="p-1 text-muted-foreground hover:text-destructive" aria-label={t("common.delete")}>
              <Trash2 className="size-3" />
            </button>
          </div>
        ))}
      </div>

      {editing && (
        <Dialog open onOpenChange={(open) => !open && setEditing(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editing.name}</DialogTitle>
            </DialogHeader>
            <CategoryForm
              category={editing}
              onDone={() => {
                setEditing(null);
                onChanged();
              }}
            />
          </DialogContent>
        </Dialog>
      )}

      <Dialog
        open={!!deleting}
        onOpenChange={(open) => {
          if (!open) {
            setDeleting(null);
            setDeleteError(null);
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("common.confirmDelete")}</DialogTitle>
          </DialogHeader>
          <p className="mt-2 text-sm text-muted-foreground">{deleting?.name}</p>
          {deleteError && <p className="mt-2 text-sm text-destructive">{deleteError}</p>}
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
    </section>
  );
}

function CategoryForm({ category, onDone }: { category?: Category; onDone: () => void }) {
  const { t } = useI18n();
  const isEdit = !!category;
  const [name, setName] = useState(category?.name ?? "");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      if (isEdit && category) await api.categories.update(category.id, { name });
      else await api.categories.create({ name, slug: slugify(name) });
      onDone();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Action impossible");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className={isEdit ? "mt-2" : "mt-3 flex items-end gap-2 rounded-lg border border-border bg-card p-3"}>
      <div className="flex-1 space-y-1.5">
        <Label>{t("common.name")}</Label>
        <Input value={name} onChange={(e) => setName(e.target.value)} required autoFocus />
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
      <Button type="submit" size="sm" disabled={submitting}>
        {submitting && <LoaderCircle className="animate-spin" />}
        {isEdit ? t("common.save") : t("common.create")}
      </Button>
    </form>
  );
}
