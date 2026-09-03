import { LoaderCircle, Truck } from "lucide-react";
import { useEffect, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { api, ApiError, type Delivery } from "@/lib/api";
import { formatCurrency, formatDate } from "@/lib/format";
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
  const [viewingId, setViewingId] = useState<string | null>(null);

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
                  <tr
                    key={d.id}
                    onClick={() => setViewingId(d.id)}
                    className="cursor-pointer border-b border-border last:border-0 hover:bg-secondary/50"
                  >
                    <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{d.orderId.slice(0, 8)}</td>
                    <td className="px-4 py-3">
                      <Badge tone={TERMINAL.has(d.status) ? (d.status === "DELIVERED" ? "success" : "destructive") : "primary"}>
                        {STATUS_LABEL[d.status] ?? d.status}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">{formatCurrency(Number(d.deliveryFee))}</td>
                    <td className="px-4 py-3 text-right" onClick={(e) => e.stopPropagation()}>
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

      {viewingId && <DeliveryDetailsDialog id={viewingId} onClose={() => setViewingId(null)} />}
    </section>
  );
}

function DeliveryDetailsDialog({ id, onClose }: { id: string; onClose: () => void }) {
  const { t } = useI18n();
  const [delivery, setDelivery] = useState<Delivery | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.deliveries
      .findOne(id)
      .then(setDelivery)
      .catch((err) => setError(err instanceof ApiError ? err.message : "Impossible de charger la livraison"));
  }, [id]);

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("purchasing.deliveryDetails")}</DialogTitle>
        </DialogHeader>
        {error && <p className="mt-2 text-sm text-destructive">{error}</p>}
        {!delivery && !error && (
          <div className="flex justify-center py-8">
            <LoaderCircle className="size-5 animate-spin text-muted-foreground" />
          </div>
        )}
        {delivery && (
          <div className="mt-3 space-y-3 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">{t("common.status")}</span>
              <Badge tone={TERMINAL.has(delivery.status) ? (delivery.status === "DELIVERED" ? "success" : "destructive") : "primary"}>
                {STATUS_LABEL[delivery.status] ?? delivery.status}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">{t("purchasing.colFee")}</span>
              <span className="font-medium text-foreground">{formatCurrency(Number(delivery.deliveryFee))}</span>
            </div>
            {delivery.failureReason && (
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">{t("common.error")}</span>
                <span className="text-destructive">{delivery.failureReason}</span>
              </div>
            )}
            {delivery.notes && (
              <div>
                <span className="text-muted-foreground">{t("common.notes")}</span>
                <p className="mt-1 text-foreground">{delivery.notes}</p>
              </div>
            )}
            {delivery.statusHistory && delivery.statusHistory.length > 0 && (
              <div>
                <p className="mb-1.5 text-xs font-medium text-muted-foreground uppercase">
                  {t("purchasing.statusHistory")}
                </p>
                <div className="space-y-1.5">
                  {delivery.statusHistory.map((h) => (
                    <div key={h.id} className="flex items-center justify-between text-xs">
                      <Badge tone="neutral">{STATUS_LABEL[h.status] ?? h.status}</Badge>
                      <span className="text-muted-foreground">{formatDate(h.createdAt)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
