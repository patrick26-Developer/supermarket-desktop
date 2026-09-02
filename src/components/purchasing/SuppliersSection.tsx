import { LoaderCircle, Plus, Truck, X } from "lucide-react";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { api, ApiError, type Supplier } from "@/lib/api";

interface SuppliersSectionProps {
  suppliers: Supplier[];
  onChanged: () => void;
}

export function SuppliersSection({ suppliers, onChanged }: SuppliersSectionProps) {
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [phone, setPhone] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await api.suppliers.create({ name, code, phone: phone || undefined });
      setName("");
      setCode("");
      setPhone("");
      setShowForm(false);
      onChanged();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Création impossible");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section>
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold text-foreground">Fournisseurs</h2>
        <Button variant="outline" size="sm" onClick={() => setShowForm((v) => !v)}>
          {showForm ? <X /> : <Plus />}
          {showForm ? "Annuler" : "Nouveau fournisseur"}
        </Button>
      </div>

      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="mt-3 grid grid-cols-3 gap-3 rounded-lg border border-border bg-card p-4"
        >
          <div className="space-y-1.5">
            <Label>Nom</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} required />
          </div>
          <div className="space-y-1.5">
            <Label>Code</Label>
            <Input value={code} onChange={(e) => setCode(e.target.value)} required />
          </div>
          <div className="space-y-1.5">
            <Label>Téléphone</Label>
            <Input value={phone} onChange={(e) => setPhone(e.target.value)} />
          </div>
          <div className="col-span-3 flex items-center gap-2">
            {error && <p className="mr-auto text-sm text-destructive">{error}</p>}
            <Button type="submit" size="sm" disabled={submitting}>
              {submitting && <LoaderCircle className="animate-spin" />}
              Créer
            </Button>
          </div>
        </form>
      )}

      <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {suppliers.length === 0 && (
          <p className="col-span-full flex items-center gap-2 py-4 text-sm text-muted-foreground">
            <Truck className="size-4" /> Aucun fournisseur.
          </p>
        )}
        {suppliers.map((s) => (
          <div key={s.id} className="rounded-lg border border-border bg-card p-3">
            <p className="text-sm font-medium text-foreground">{s.name}</p>
            <p className="text-xs text-muted-foreground">
              {s.code}
              {s.phone ? ` · ${s.phone}` : ""}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
