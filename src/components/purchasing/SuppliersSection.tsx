import { LoaderCircle, Pencil, Plus, Search, Trash2, Truck, X } from "lucide-react";
import { useMemo, useState } from "react";

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
import { api, ApiError, type Supplier } from "@/lib/api";
import { useI18n } from "@/lib/i18n";

interface SuppliersSectionProps {
  suppliers: Supplier[];
  onChanged: () => void;
}

export function SuppliersSection({ suppliers, onChanged }: SuppliersSectionProps) {
  const { t } = useI18n();
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Supplier | null>(null);
  const [deleting, setDeleting] = useState<Supplier | null>(null);
  const [query, setQuery] = useState("");

  const filtered = useMemo(
    () =>
      suppliers
        .filter((s) => `${s.name} ${s.code} ${s.phone ?? ""}`.toLowerCase().includes(query.toLowerCase()))
        .sort((a, b) => a.name.localeCompare(b.name)),
    [suppliers, query],
  );

  async function handleDelete() {
    if (!deleting) return;
    try {
      await api.suppliers.remove(deleting.id);
      setDeleting(null);
      onChanged();
    } catch {
      setDeleting(null);
    }
  }

  return (
    <section>
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold text-foreground">{t("purchasing.suppliers")}</h2>
        <Button variant="outline" size="sm" onClick={() => setShowForm((v) => !v)}>
          {showForm ? <X /> : <Plus />}
          {showForm ? t("common.cancel") : t("purchasing.newSupplier")}
        </Button>
      </div>

      {showForm && (
        <SupplierForm
          onDone={() => {
            setShowForm(false);
            onChanged();
          }}
        />
      )}

      {suppliers.length > 3 && (
        <div className="relative mt-3">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder={t("purchasing.searchSuppliers")} className="max-w-xs pl-9" />
        </div>
      )}

      <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.length === 0 && (
          <p className="col-span-full flex items-center gap-2 py-4 text-sm text-muted-foreground">
            <Truck className="size-4" /> {t("purchasing.noSuppliers")}
          </p>
        )}
        {filtered.map((s) => (
          <div
            key={s.id}
            onClick={() => setEditing(s)}
            className="flex cursor-pointer items-start justify-between rounded-lg border border-border bg-card p-3 hover:border-primary/40"
          >
            <div className="min-w-0">
              <p className="text-sm font-medium text-foreground">{s.name}</p>
              <p className="text-xs text-muted-foreground">
                {s.code}
                {s.phone ? ` · ${s.phone}` : ""}
              </p>
            </div>
            <div className="flex shrink-0 gap-1" onClick={(e) => e.stopPropagation()}>
              <button type="button" onClick={() => setEditing(s)} className="p-1 text-muted-foreground hover:text-primary" aria-label={t("common.details")}>
                <Pencil className="size-3.5" />
              </button>
              <button type="button" onClick={() => setDeleting(s)} className="p-1 text-muted-foreground hover:text-destructive" aria-label={t("common.delete")}>
                <Trash2 className="size-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {editing && (
        <Dialog open onOpenChange={(open) => !open && setEditing(null)}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>{editing.name}</DialogTitle>
            </DialogHeader>
            <SupplierForm
              supplier={editing}
              onDone={() => {
                setEditing(null);
                onChanged();
              }}
            />
          </DialogContent>
        </Dialog>
      )}

      <Dialog open={!!deleting} onOpenChange={(open) => !open && setDeleting(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("common.confirmDelete")}</DialogTitle>
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
    </section>
  );
}

function SupplierForm({ supplier, onDone }: { supplier?: Supplier; onDone: () => void }) {
  const { t } = useI18n();
  const isEdit = !!supplier;
  const [name, setName] = useState(supplier?.name ?? "");
  const [code, setCode] = useState(supplier?.code ?? "");
  const [phone, setPhone] = useState(supplier?.phone ?? "");
  const [email, setEmail] = useState(supplier?.email ?? "");
  const [contactName, setContactName] = useState(supplier?.contactName ?? "");
  const [address, setAddress] = useState(supplier?.address ?? "");
  const [city, setCity] = useState(supplier?.city ?? "");
  const [taxNumber, setTaxNumber] = useState(supplier?.taxNumber ?? "");
  const [status, setStatus] = useState(supplier?.status ?? "ACTIVE");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const payload = {
        name,
        phone: phone || undefined,
        email: email || undefined,
        contactName: contactName || undefined,
        address: address || undefined,
        city: city || undefined,
        taxNumber: taxNumber || undefined,
      };
      if (isEdit && supplier) await api.suppliers.update(supplier.id, { ...payload, status });
      else await api.suppliers.create({ ...payload, code });
      onDone();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Action impossible");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className={isEdit ? "mt-2" : "mt-3 rounded-lg border border-border bg-card p-4"}>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <div className="space-y-1.5">
          <Label>{t("common.name")}</Label>
          <Input value={name} onChange={(e) => setName(e.target.value)} required />
        </div>
        {!isEdit && (
          <div className="space-y-1.5">
            <Label>{t("purchasing.code")}</Label>
            <Input value={code} onChange={(e) => setCode(e.target.value)} required />
          </div>
        )}
        <div className="space-y-1.5">
          <Label>{t("purchasing.contactName")}</Label>
          <Input value={contactName} onChange={(e) => setContactName(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label>{t("purchasing.phone")}</Label>
          <Input value={phone} onChange={(e) => setPhone(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label>{t("purchasing.email")}</Label>
          <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label>{t("purchasing.taxNumber")}</Label>
          <Input value={taxNumber} onChange={(e) => setTaxNumber(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label>{t("purchasing.city")}</Label>
          <Input value={city} onChange={(e) => setCity(e.target.value)} />
        </div>
        <div className="col-span-2 space-y-1.5">
          <Label>{t("purchasing.address")}</Label>
          <Input value={address} onChange={(e) => setAddress(e.target.value)} />
        </div>
        {isEdit && (
          <div className="space-y-1.5">
            <Label>{t("common.status")}</Label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
            >
              <option value="ACTIVE">ACTIVE</option>
              <option value="INACTIVE">INACTIVE</option>
              <option value="BLOCKED">BLOCKED</option>
              <option value="ARCHIVED">ARCHIVED</option>
            </select>
          </div>
        )}
      </div>
      <div className="mt-3 flex items-center gap-2">
        {error && <p className="mr-auto text-sm text-destructive">{error}</p>}
        <Button type="submit" size="sm" disabled={submitting}>
          {submitting && <LoaderCircle className="animate-spin" />}
          {isEdit ? t("common.save") : t("common.create")}
        </Button>
      </div>
    </form>
  );
}
