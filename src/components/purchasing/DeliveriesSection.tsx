import { LoaderCircle, Truck } from "lucide-react";
import { useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { api, ApiError, type Delivery } from "@/lib/api";
import { formatCurrency } from "@/lib/format";
import { useI18n } from "@/lib/i18n";

const NEXT_STATUS: Record<string, string | undefined> = {
  PENDING: "ASSIGNED",
  ASSIGNED: "PICKED_UP",
  PICKED_UP: "IN_TRANSIT",
  IN_TRANSIT: "DELIVERED",
};

const STATUS_LABEL: Record<string, string> = {
  PENDING: "En attente",
  ASSIGNED: "Assignée",
  PICKED_UP: "Récupérée",
  IN_TRANSIT: "En route",
  DELIVERED: "Livrée",
  FAILED: "Échouée",
  CANCELLED: "Annulée",
};

const TERMINAL = new Set(["DELIVERED", "FAILED", "CANCELLED"]);

interface DeliveriesSectionProps {
  deliveries: Delivery[];
  onChanged: () => void;
}

export function DeliveriesSection({ deliveries, onChanged }: DeliveriesSectionProps) {
  const { t } = useI18n();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function advance(id: string, next: string) {
    setBusyId(id);
    setError(null);
    try {
      await api.deliveries.updateStatus(id, next);
      onChanged();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Action impossible");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <section className="mt-10">
      <h2 className="text-base font-semibold text-foreground">{t("purchasing.deliveries")}</h2>
      {error && <p className="mt-2 text-sm text-destructive">{error}</p>}
      <div className="mt-3 overflow-hidden rounded-lg border border-border bg-card">
        {deliveries.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-12 text-center text-muted-foreground">
            <Truck className="size-7" />
            <p className="text-sm">{t("purchasing.noDeliveries")}</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs text-muted-foreground uppercase">
                <th className="px-4 py-3 font-medium">{t("purchasing.colOrder")}</th>
                <th className="px-4 py-3 font-medium">{t("common.status")}</th>
                <th className="px-4 py-3 font-medium">{t("purchasing.colFee")}</th>
                <th className="px-4 py-3 font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {deliveries.map((d) => {
                const next = NEXT_STATUS[d.status];
                return (
                  <tr key={d.id} className="border-b border-border last:border-0">
                    <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{d.orderId.slice(0, 8)}</td>
                    <td className="px-4 py-3">
                      <Badge tone={TERMINAL.has(d.status) ? (d.status === "DELIVERED" ? "success" : "destructive") : "primary"}>
                        {STATUS_LABEL[d.status] ?? d.status}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">{formatCurrency(Number(d.deliveryFee))}</td>
                    <td className="px-4 py-3 text-right">
                      {busyId === d.id ? (
                        <LoaderCircle className="ml-auto size-4 animate-spin text-muted-foreground" />
                      ) : (
                        next && (
                          <Button size="sm" variant="outline" onClick={() => advance(d.id, next)}>
                            → {STATUS_LABEL[next]}
                          </Button>
                        )
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </section>
  );
}
