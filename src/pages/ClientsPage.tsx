import { LoaderCircle, MapPin, Pencil, Plus, Search, Star, Trash2, Users, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useDefaultStore } from "@/hooks/use-default-store";
import { api, ApiError, type Customer, type CustomerDetail } from "@/lib/api";
import { useI18n } from "@/lib/i18n";

export function ClientsPage() {
  const { t } = useI18n();
  const { storeId, loading: storeLoading } = useDefaultStore();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Customer | null>(null);
  const [query, setQuery] = useState("");

  async function load() {
    if (!storeId) return;
    setLoading(true);
    setError(null);
    try {
      setCustomers(await api.customers.list(storeId));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Impossible de contacter le serveur");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storeId]);

  const filtered = useMemo(() => {
    const q = query.toLowerCase();
    return customers
      .filter((c) => `${c.firstName ?? ""} ${c.lastName ?? ""} ${c.companyName ?? ""} ${c.phone ?? ""} ${c.email ?? ""}`.toLowerCase().includes(q))
      .sort((a, b) => {
        const an = a.companyName || `${a.firstName ?? ""}${a.lastName ?? ""}`;
        const bn = b.companyName || `${b.firstName ?? ""}${b.lastName ?? ""}`;
        return an.localeCompare(bn);
      });
  }, [customers, query]);

  if (storeLoading) {
    return (
      <div className="flex h-full items-center justify-center text-muted-foreground">
        <LoaderCircle className="size-5 animate-spin" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-10 py-10">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-primary">{t("clients.eyebrow")}</p>
          <h1 className="mt-1 text-2xl font-semibold text-foreground">{t("clients.title")}</h1>
        </div>
        <Button onClick={() => setShowForm((v) => !v)}>
          {showForm ? <X /> : <Plus />}
          {showForm ? t("common.cancel") : t("clients.newClient")}
        </Button>
      </div>

      {showForm && storeId && (
        <CustomerForm
          storeId={storeId}
          onDone={() => {
            setShowForm(false);
            load();
          }}
        />
      )}

      <div className="relative mt-6">
        <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder={t("clients.searchPlaceholder")} className="max-w-sm pl-9" />
      </div>

      {error && <p className="mt-4 text-sm text-destructive">{error}</p>}

      <div className="mt-4 overflow-hidden rounded-lg border border-border bg-card">
        {loading ? (
          <div className="flex items-center justify-center py-16 text-muted-foreground">
            <LoaderCircle className="size-5 animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-16 text-center text-muted-foreground">
            <Users className="size-8" />
            <p className="text-sm">{t("clients.noClients")}</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs text-muted-foreground uppercase">
                <th className="px-4 py-3 font-medium">{t("clients.colClient")}</th>
                <th className="px-4 py-3 font-medium">{t("clients.colNumber")}</th>
                <th className="px-4 py-3 font-medium">{t("clients.colPhone")}</th>
                <th className="px-4 py-3 font-medium">{t("clients.colEmail")}</th>
                <th className="px-4 py-3 font-medium">{t("clients.colType")}</th>
                <th className="px-4 py-3 font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((c) => (
                <tr
                  key={c.id}
                  onClick={() => setEditing(c)}
                  className="cursor-pointer border-b border-border last:border-0 hover:bg-secondary/50"
                >
                  <td className="px-4 py-3 font-medium text-foreground">
                    {c.companyName || `${c.firstName ?? ""} ${c.lastName ?? ""}`.trim() || "—"}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{c.customerNo}</td>
                  <td className="px-4 py-3 text-muted-foreground">{c.phone ?? "—"}</td>
                  <td className="px-4 py-3 text-muted-foreground">{c.email ?? "—"}</td>
                  <td className="px-4 py-3">
                    <Badge tone={c.type === "BUSINESS" ? "accent" : "neutral"}>
                      {c.type === "BUSINESS" ? t("clients.business") : t("clients.individual")}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                    <button type="button" onClick={() => setEditing(c)} className="p-1 text-muted-foreground hover:text-primary" aria-label={t("common.details")}>
                      <Pencil className="size-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {editing && storeId && (
        <Dialog open onOpenChange={(open) => !open && setEditing(null)}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>{editing.companyName || `${editing.firstName ?? ""} ${editing.lastName ?? ""}`}</DialogTitle>
            </DialogHeader>
            <CustomerForm
              storeId={storeId}
              customer={editing}
              onDone={() => {
                setEditing(null);
                load();
              }}
            />
            <div className="mt-5 border-t border-border pt-4">
              <AddressesSection customerId={editing.id} />
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

function CustomerForm({
  storeId,
  customer,
  onDone,
}: {
  storeId: string;
  customer?: Customer;
  onDone: () => void;
}) {
  const { t } = useI18n();
  const isEdit = !!customer;
  const [type, setType] = useState<"INDIVIDUAL" | "BUSINESS">((customer?.type as "INDIVIDUAL" | "BUSINESS") ?? "INDIVIDUAL");
  const [firstName, setFirstName] = useState(customer?.firstName ?? "");
  const [lastName, setLastName] = useState(customer?.lastName ?? "");
  const [companyName, setCompanyName] = useState(customer?.companyName ?? "");
  const [phone, setPhone] = useState(customer?.phone ?? "");
  const [email, setEmail] = useState(customer?.email ?? "");
  const [status, setStatus] = useState(customer?.status ?? "ACTIVE");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const payload = {
        type,
        firstName: type === "INDIVIDUAL" ? firstName : undefined,
        lastName: type === "INDIVIDUAL" ? lastName : undefined,
        companyName: type === "BUSINESS" ? companyName : undefined,
        phone: phone || undefined,
        email: email || undefined,
      };
      if (isEdit && customer) await api.customers.update(customer.id, { ...payload, status });
      else await api.customers.create({ storeId, ...payload });
      onDone();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Action impossible");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className={isEdit ? "mt-2" : "mt-4 rounded-lg border border-border bg-card p-5"}>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setType("INDIVIDUAL")}
          className={`rounded-md px-3 py-1.5 text-sm font-medium ${type === "INDIVIDUAL" ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground"}`}
        >
          {t("clients.individual")}
        </button>
        <button
          type="button"
          onClick={() => setType("BUSINESS")}
          className={`rounded-md px-3 py-1.5 text-sm font-medium ${type === "BUSINESS" ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground"}`}
        >
          {t("clients.business")}
        </button>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-3">
        {type === "INDIVIDUAL" ? (
          <>
            <div className="space-y-1.5">
              <Label>{t("clients.firstName")}</Label>
              <Input value={firstName} onChange={(e) => setFirstName(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>{t("clients.lastName")}</Label>
              <Input value={lastName} onChange={(e) => setLastName(e.target.value)} />
            </div>
          </>
        ) : (
          <div className="col-span-2 space-y-1.5">
            <Label>{t("clients.companyName")}</Label>
            <Input value={companyName} onChange={(e) => setCompanyName(e.target.value)} />
          </div>
        )}
        <div className="space-y-1.5">
          <Label>{t("purchasing.phone")}</Label>
          <Input value={phone} onChange={(e) => setPhone(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label>{t("purchasing.email")}</Label>
          <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
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

      <div className="mt-4 flex items-center gap-2">
        {error && <p className="mr-auto text-sm text-destructive">{error}</p>}
        <Button type="submit" size="sm" disabled={submitting}>
          {submitting && <LoaderCircle className="animate-spin" />}
          {isEdit ? t("common.save") : t("common.create")}
        </Button>
      </div>
    </form>
  );
}

function AddressesSection({ customerId }: { customerId: string }) {
  const { t } = useI18n();
  const [detail, setDetail] = useState<CustomerDetail | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    try {
      setDetail(await api.customers.findOne(customerId));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Impossible de charger les adresses");
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [customerId]);

  async function removeAddress(addressId: string) {
    try {
      await api.customers.removeAddress(customerId, addressId);
      load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Suppression impossible");
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-foreground">{t("clients.addresses")}</p>
        <Button variant="outline" size="sm" onClick={() => setShowForm((v) => !v)}>
          {showForm ? <X className="size-3.5" /> : <Plus className="size-3.5" />}
          {showForm ? t("common.cancel") : t("clients.addAddress")}
        </Button>
      </div>

      {error && <p className="mt-2 text-sm text-destructive">{error}</p>}

      {showForm && (
        <AddressForm
          customerId={customerId}
          onDone={() => {
            setShowForm(false);
            load();
          }}
        />
      )}

      <div className="mt-3 space-y-2">
        {!detail ? (
          <LoaderCircle className="size-4 animate-spin text-muted-foreground" />
        ) : detail.addresses.length === 0 ? (
          <p className="flex items-center gap-2 text-sm text-muted-foreground">
            <MapPin className="size-4" /> {t("clients.noAddresses")}
          </p>
        ) : (
          detail.addresses.map((a) => (
            <div key={a.id} className="flex items-start justify-between rounded-md border border-border p-2.5 text-sm">
              <div>
                <p className="flex items-center gap-1.5 font-medium text-foreground">
                  {a.recipient}
                  {a.isDefault && <Star className="size-3 fill-accent text-accent" />}
                </p>
                <p className="text-xs text-muted-foreground">
                  {a.address}, {a.city}
                  {a.phone ? ` · ${a.phone}` : ""}
                </p>
              </div>
              <button type="button" onClick={() => removeAddress(a.id)} className="p-1 text-muted-foreground hover:text-destructive" aria-label={t("common.delete")}>
                <Trash2 className="size-3.5" />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function AddressForm({ customerId, onDone }: { customerId: string; onDone: () => void }) {
  const { t } = useI18n();
  const [recipient, setRecipient] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [isDefault, setIsDefault] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await api.customers.addAddress(customerId, { recipient, phone: phone || undefined, address, city, isDefault });
      onDone();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Action impossible");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mt-3 space-y-2 rounded-md border border-border bg-secondary/40 p-3">
      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1">
          <Label className="text-xs">{t("clients.recipient")}</Label>
          <Input value={recipient} onChange={(e) => setRecipient(e.target.value)} required className="h-8 text-sm" />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">{t("purchasing.phone")}</Label>
          <Input value={phone} onChange={(e) => setPhone(e.target.value)} className="h-8 text-sm" />
        </div>
        <div className="col-span-2 space-y-1">
          <Label className="text-xs">{t("clients.address")}</Label>
          <Input value={address} onChange={(e) => setAddress(e.target.value)} required className="h-8 text-sm" />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">{t("clients.city")}</Label>
          <Input value={city} onChange={(e) => setCity(e.target.value)} required className="h-8 text-sm" />
        </div>
      </div>
      <label className="flex items-center gap-2 text-xs text-muted-foreground">
        <input type="checkbox" checked={isDefault} onChange={(e) => setIsDefault(e.target.checked)} className="size-3.5 accent-primary" />
        {t("clients.isDefault")}
      </label>
      <div className="flex items-center gap-2">
        {error && <p className="mr-auto text-xs text-destructive">{error}</p>}
        <Button type="submit" size="sm" disabled={submitting}>
          {submitting && <LoaderCircle className="animate-spin" />}
          {t("common.create")}
        </Button>
      </div>
    </form>
  );
}
