import { Info, LoaderCircle, Receipt, Wallet } from "lucide-react";
import { useEffect, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { useDefaultStore } from "@/hooks/use-default-store";
import { api, ApiError, type CashMovement, type Payment, type Permission } from "@/lib/api";
import { formatCurrency, formatDate } from "@/lib/format";
import { useI18n } from "@/lib/i18n";
import { can } from "@/lib/permissions";

const PAYMENT_STATUS_TONE: Record<string, "neutral" | "primary" | "success" | "destructive"> = {
  PENDING: "neutral",
  PROCESSING: "primary",
  CONFIRMED: "success",
  FAILED: "destructive",
  CANCELLED: "destructive",
  REFUNDED: "neutral",
  PARTIALLY_REFUNDED: "neutral",
};

const PAYMENT_STATUS_LABEL: Record<string, string> = {
  PENDING: "En attente",
  PROCESSING: "En cours",
  CONFIRMED: "Confirmé",
  FAILED: "Échoué",
  CANCELLED: "Annulé",
  REFUNDED: "Remboursé",
  PARTIALLY_REFUNDED: "Partiellement remboursé",
};

const MOVEMENT_TYPE_LABEL: Record<string, string> = {
  OPENING_FLOAT: "Fond de caisse",
  CASH_SALE: "Vente",
  CASH_REFUND: "Remboursement",
  CASH_IN: "Entrée",
  CASH_OUT: "Sortie",
  EXPENSE: "Dépense",
  SAFE_DEPOSIT: "Dépôt coffre",
  CASH_CORRECTION: "Correction",
};

export function ComptabilitePage({ permissions }: { permissions: Permission[] }) {
  const { t } = useI18n();
  const { storeId, loading: storeLoading } = useDefaultStore();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [movements, setMovements] = useState<CashMovement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const canReadPayments = can(permissions, "PAYMENTS", "READ");
  const canReadMovements = can(permissions, "CASH_MOVEMENTS", "READ");

  useEffect(() => {
    if (!storeId) {
      // storeId ne se résout jamais pour un rôle sans CASH_REGISTERS:READ —
      // voir useDefaultStore et l'entrée PROGRESS.md du 2026-09-05.
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    Promise.all([
      canReadPayments ? api.payments.list(storeId) : Promise.resolve([]),
      canReadMovements ? api.cashMovements.list(storeId) : Promise.resolve([]),
    ])
      .then(([p, m]) => {
        setPayments(p);
        setMovements(m);
      })
      .catch((err) => setError(err instanceof ApiError ? err.message : "Impossible de contacter le serveur"))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storeId]);

  if (storeLoading || loading) {
    return (
      <div className="flex h-full items-center justify-center text-muted-foreground">
        <LoaderCircle className="size-5 animate-spin" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-10 py-10 pb-16">
      <p className="text-sm font-medium text-primary">{t("comptabilite.eyebrow")}</p>
      <h1 className="mt-1 text-2xl font-semibold text-foreground">{t("comptabilite.title")}</h1>

      <div className="mt-4 flex items-start gap-2 rounded-lg border border-border bg-muted/40 px-4 py-3 text-sm text-muted-foreground">
        <Info className="mt-0.5 size-4 shrink-0" />
        <p>{t("comptabilite.readOnlyNote")}</p>
      </div>

      {error && <p className="mt-3 text-sm text-destructive">{error}</p>}

      {canReadPayments && (
        <section className="mt-8">
          <h2 className="text-base font-semibold text-foreground">{t("comptabilite.payments")}</h2>
          <div className="mt-3 overflow-hidden rounded-lg border border-border bg-card">
            {payments.length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-12 text-center text-muted-foreground">
                <Receipt className="size-7" />
                <p className="text-sm">{t("comptabilite.noPayments")}</p>
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-xs text-muted-foreground uppercase">
                    <th className="px-4 py-3 font-medium">{t("purchasing.colReference")}</th>
                    <th className="px-4 py-3 font-medium">{t("comptabilite.colMethod")}</th>
                    <th className="px-4 py-3 font-medium">{t("common.status")}</th>
                    <th className="px-4 py-3 font-medium">{t("comptabilite.colAmount")}</th>
                    <th className="px-4 py-3 font-medium">{t("comptabilite.colDate")}</th>
                  </tr>
                </thead>
                <tbody>
                  {payments.map((p) => (
                    <tr key={p.id} className="border-b border-border last:border-0">
                      <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{p.reference}</td>
                      <td className="px-4 py-3">{p.method}</td>
                      <td className="px-4 py-3">
                        <Badge tone={PAYMENT_STATUS_TONE[p.status] ?? "neutral"}>
                          {PAYMENT_STATUS_LABEL[p.status] ?? p.status}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 font-medium text-foreground">{formatCurrency(Number(p.amount))}</td>
                      <td className="px-4 py-3 text-muted-foreground">{formatDate(p.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </section>
      )}

      {canReadMovements && (
        <section className="mt-10">
          <h2 className="text-base font-semibold text-foreground">{t("comptabilite.movements")}</h2>
          <div className="mt-3 overflow-hidden rounded-lg border border-border bg-card">
            {movements.length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-12 text-center text-muted-foreground">
                <Wallet className="size-7" />
                <p className="text-sm">{t("comptabilite.noMovements")}</p>
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-xs text-muted-foreground uppercase">
                    <th className="px-4 py-3 font-medium">{t("comptabilite.colType")}</th>
                    <th className="px-4 py-3 font-medium">{t("comptabilite.colAmount")}</th>
                    <th className="px-4 py-3 font-medium">{t("comptabilite.colReason")}</th>
                    <th className="px-4 py-3 font-medium">{t("comptabilite.colDate")}</th>
                  </tr>
                </thead>
                <tbody>
                  {movements.map((m) => {
                    const amount = Number(m.amount);
                    return (
                      <tr key={m.id} className="border-b border-border last:border-0">
                        <td className="px-4 py-3">{MOVEMENT_TYPE_LABEL[m.type] ?? m.type}</td>
                        <td className={`px-4 py-3 font-medium ${amount < 0 ? "text-destructive" : "text-foreground"}`}>
                          {formatCurrency(amount)}
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">{m.reason ?? "—"}</td>
                        <td className="px-4 py-3 text-muted-foreground">{formatDate(m.createdAt)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </section>
      )}
    </div>
  );
}
