import { LoaderCircle, Plus, Users, X } from "lucide-react";
import { useEffect, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useDefaultStore } from "@/hooks/use-default-store";
import { api, ApiError, type Customer } from "@/lib/api";

export function ClientsPage() {
  const { storeId, loading: storeLoading } = useDefaultStore();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);

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
          <p className="text-sm font-medium text-primary">Clients</p>
          <h1 className="mt-1 text-2xl font-semibold text-foreground">Clientèle</h1>
        </div>
        <Button onClick={() => setShowForm((v) => !v)}>
          {showForm ? <X /> : <Plus />}
          {showForm ? "Annuler" : "Nouveau client"}
        </Button>
      </div>

      {showForm && storeId && (
        <NewCustomerForm
          storeId={storeId}
          onCreated={() => {
            setShowForm(false);
            load();
          }}
        />
      )}

      {error && <p className="mt-4 text-sm text-destructive">{error}</p>}

      <div className="mt-6 overflow-hidden rounded-lg border border-border bg-card">
        {loading ? (
          <div className="flex items-center justify-center py-16 text-muted-foreground">
            <LoaderCircle className="size-5 animate-spin" />
          </div>
        ) : customers.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-16 text-center text-muted-foreground">
            <Users className="size-8" />
            <p className="text-sm">Aucun client.</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs text-muted-foreground uppercase">
                <th className="px-4 py-3 font-medium">Client</th>
                <th className="px-4 py-3 font-medium">N°</th>
                <th className="px-4 py-3 font-medium">Téléphone</th>
                <th className="px-4 py-3 font-medium">Email</th>
                <th className="px-4 py-3 font-medium">Type</th>
              </tr>
            </thead>
            <tbody>
              {customers.map((c) => (
                <tr key={c.id} className="border-b border-border last:border-0">
                  <td className="px-4 py-3 font-medium text-foreground">
                    {c.companyName || `${c.firstName ?? ""} ${c.lastName ?? ""}`.trim() || "—"}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{c.customerNo}</td>
                  <td className="px-4 py-3 text-muted-foreground">{c.phone ?? "—"}</td>
                  <td className="px-4 py-3 text-muted-foreground">{c.email ?? "—"}</td>
                  <td className="px-4 py-3">
                    <Badge tone={c.type === "BUSINESS" ? "accent" : "neutral"}>
                      {c.type === "BUSINESS" ? "Entreprise" : "Particulier"}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

function NewCustomerForm({ storeId, onCreated }: { storeId: string; onCreated: () => void }) {
  const [type, setType] = useState<"INDIVIDUAL" | "BUSINESS">("INDIVIDUAL");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [phone, setPhone] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await api.customers.create({
        storeId,
        type,
        firstName: type === "INDIVIDUAL" ? firstName : undefined,
        lastName: type === "INDIVIDUAL" ? lastName : undefined,
        companyName: type === "BUSINESS" ? companyName : undefined,
        phone: phone || undefined,
      });
      onCreated();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Création impossible");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mt-4 rounded-lg border border-border bg-card p-5">
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setType("INDIVIDUAL")}
          className={`rounded-md px-3 py-1.5 text-sm font-medium ${type === "INDIVIDUAL" ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground"}`}
        >
          Particulier
        </button>
        <button
          type="button"
          onClick={() => setType("BUSINESS")}
          className={`rounded-md px-3 py-1.5 text-sm font-medium ${type === "BUSINESS" ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground"}`}
        >
          Entreprise
        </button>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-3">
        {type === "INDIVIDUAL" ? (
          <>
            <div className="space-y-1.5">
              <Label>Prénom</Label>
              <Input value={firstName} onChange={(e) => setFirstName(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Nom</Label>
              <Input value={lastName} onChange={(e) => setLastName(e.target.value)} />
            </div>
          </>
        ) : (
          <div className="col-span-2 space-y-1.5">
            <Label>Raison sociale</Label>
            <Input value={companyName} onChange={(e) => setCompanyName(e.target.value)} />
          </div>
        )}
        <div className="space-y-1.5">
          <Label>Téléphone</Label>
          <Input value={phone} onChange={(e) => setPhone(e.target.value)} />
        </div>
      </div>

      <div className="mt-4 flex items-center gap-2">
        {error && <p className="mr-auto text-sm text-destructive">{error}</p>}
        <Button type="submit" size="sm" disabled={submitting}>
          {submitting && <LoaderCircle className="animate-spin" />}
          Créer
        </Button>
      </div>
    </form>
  );
}
