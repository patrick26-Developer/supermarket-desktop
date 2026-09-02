import { LoaderCircle, ShoppingCart, Trash2 } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { CartLine } from "@/hooks/use-cart";
import { formatCurrency } from "@/lib/format";

const PAYMENT_METHODS: { value: string; label: string }[] = [
  { value: "CASH", label: "Espèces" },
  { value: "MTN_MOMO", label: "MTN Mobile Money" },
  { value: "AIRTEL_MONEY", label: "Airtel Money" },
  { value: "CARD", label: "Carte bancaire" },
  { value: "BANK_TRANSFER", label: "Virement" },
  { value: "OTHER", label: "Autre" },
];

interface CartPanelProps {
  lines: CartLine[];
  totals: { subtotal: number; tax: number; total: number };
  onUpdateQuantity: (productId: string, quantity: number) => void;
  onUpdateUnitPrice: (productId: string, unitPrice: number) => void;
  onRemove: (productId: string) => void;
  onCheckout: (method: string, forceFailure: boolean) => Promise<void>;
  submitting: boolean;
  submitError: string | null;
}

export function CartPanel({
  lines,
  totals,
  onUpdateQuantity,
  onUpdateUnitPrice,
  onRemove,
  onCheckout,
  submitting,
  submitError,
}: CartPanelProps) {
  const [method, setMethod] = useState("CASH");
  const [forceFailure, setForceFailure] = useState(false);

  const isEmpty = lines.length === 0;
  const hasZeroPricedLine = lines.some((l) => l.unitPrice <= 0);

  return (
    <div className="flex h-full flex-col">
      <div className="flex-1 overflow-y-auto">
        {isEmpty ? (
          <div className="flex h-full flex-col items-center justify-center gap-2 text-center text-muted-foreground">
            <ShoppingCart className="size-8" />
            <p className="text-sm">Panier vide — ajoutez un produit depuis la recherche.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {lines.map((line) => (
              <div key={line.product.id} className="rounded-lg border border-border bg-card p-3">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm font-medium text-foreground">{line.product.name}</p>
                  <button
                    type="button"
                    onClick={() => onRemove(line.product.id)}
                    aria-label="Retirer"
                    className="shrink-0 text-muted-foreground transition-colors hover:text-destructive"
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                </div>
                <div className="mt-2 grid grid-cols-[1fr_1fr_auto] items-end gap-2">
                  <div className="space-y-1">
                    <Label className="text-[11px] text-muted-foreground">Qté</Label>
                    <Input
                      type="number"
                      min="0.001"
                      step="1"
                      value={line.quantity}
                      onChange={(e) => onUpdateQuantity(line.product.id, Number(e.target.value))}
                      className="h-8 text-sm"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[11px] text-muted-foreground">Prix unitaire</Label>
                    <Input
                      type="number"
                      min="0"
                      step="1"
                      value={line.unitPrice}
                      onChange={(e) => onUpdateUnitPrice(line.product.id, Number(e.target.value))}
                      className="h-8 text-sm"
                    />
                  </div>
                  <p className="pb-1.5 text-right text-sm font-medium whitespace-nowrap text-foreground">
                    {formatCurrency(line.unitPrice * line.quantity)}
                  </p>
                </div>
              </div>
            ))}
            {hasZeroPricedLine && (
              <p className="text-xs text-muted-foreground">
                Pas de prix par magasin pour l'instant — vérifiez le prix unitaire de chaque ligne
                avant d'encaisser.
              </p>
            )}
          </div>
        )}
      </div>

      <div className="mt-4 shrink-0 space-y-3 border-t border-border pt-4">
        <div className="space-y-1 text-sm">
          <div className="flex justify-between text-muted-foreground">
            <span>Sous-total</span>
            <span>{formatCurrency(totals.subtotal)}</span>
          </div>
          <div className="flex justify-between text-muted-foreground">
            <span>TVA</span>
            <span>{formatCurrency(totals.tax)}</span>
          </div>
          <div className="flex justify-between text-base font-semibold text-foreground">
            <span>Total</span>
            <span>{formatCurrency(totals.total)}</span>
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="payment-method" className="text-xs">
            Mode de paiement
          </Label>
          <select
            id="payment-method"
            value={method}
            onChange={(e) => setMethod(e.target.value)}
            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
          >
            {PAYMENT_METHODS.map((m) => (
              <option key={m.value} value={m.value}>
                {m.label}
              </option>
            ))}
          </select>
        </div>

        {method !== "CASH" && (
          <label className="flex items-center gap-2 text-xs text-muted-foreground">
            <input
              type="checkbox"
              checked={forceFailure}
              onChange={(e) => setForceFailure(e.target.checked)}
              className="size-3.5 accent-primary"
            />
            Simuler un échec de paiement (test — mobile money simulé)
          </label>
        )}

        {submitError && <p className="text-sm text-destructive">{submitError}</p>}

        <Button
          type="button"
          className="w-full"
          size="lg"
          disabled={isEmpty || submitting || totals.total <= 0}
          onClick={() => onCheckout(method, forceFailure)}
        >
          {submitting && <LoaderCircle className="animate-spin" />}
          Encaisser {!isEmpty && formatCurrency(totals.total)}
        </Button>
      </div>
    </div>
  );
}
