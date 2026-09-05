import { LoaderCircle } from "lucide-react";
import { useEffect, useState } from "react";

import { DeliveriesSection } from "@/components/purchasing/DeliveriesSection";
import { PurchaseOrdersSection } from "@/components/purchasing/PurchaseOrdersSection";
import { SuppliersSection } from "@/components/purchasing/SuppliersSection";
import { useDefaultStore } from "@/hooks/use-default-store";
import { api, ApiError, type Delivery, type Permission, type PurchaseOrder, type Supplier } from "@/lib/api";
import { useI18n } from "@/lib/i18n";
import { can } from "@/lib/permissions";

export function PurchasingPage({ permissions }: { permissions: Permission[] }) {
  const { t } = useI18n();
  const { storeId, loading: storeLoading } = useDefaultStore();
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [orders, setOrders] = useState<PurchaseOrder[]>([]);
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const canReadSuppliers = can(permissions, "SUPPLIERS", "READ");
  const canReadOrders = can(permissions, "PURCHASE_ORDERS", "READ");
  const canReadDeliveries = can(permissions, "DELIVERIES", "READ");

  async function load() {
    if (!storeId) {
      // storeId ne se résout jamais pour un rôle sans CASH_REGISTERS:READ
      // (Livreur, Caissier, Comptable…) — voir useDefaultStore. Sans ce
      // garde, `loading` reste bloqué à `true` pour toujours et la page
      // n'affiche qu'un spinner sans fin.
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      // Requêtes indépendantes : un rôle peut n'avoir qu'UN des trois droits
      // (ex. Livreur n'a que DELIVERIES:READ, pas SUPPLIERS ni
      // PURCHASE_ORDERS) — un 403 sur l'une ne doit pas faire échouer les
      // autres.
      const [supplierList, orderList, deliveryList] = await Promise.all([
        canReadSuppliers ? api.suppliers.list() : Promise.resolve([]),
        canReadOrders ? api.purchaseOrders.list(storeId) : Promise.resolve([]),
        canReadDeliveries ? api.deliveries.list(storeId) : Promise.resolve([]),
      ]);
      setSuppliers(supplierList);
      setOrders(orderList);
      setDeliveries(deliveryList);
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

  if (storeLoading || (loading && orders.length === 0 && suppliers.length === 0)) {
    return (
      <div className="flex h-full items-center justify-center text-muted-foreground">
        <LoaderCircle className="size-5 animate-spin" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-10 py-10 pb-16">
      <p className="text-sm font-medium text-primary">{t("purchasing.eyebrow")}</p>
      <h1 className="mt-1 text-2xl font-semibold text-foreground">{t("purchasing.title")}</h1>

      {error && <p className="mt-3 text-sm text-destructive">{error}</p>}

      {canReadSuppliers && (
        <div className="mt-6">
          <SuppliersSection
            suppliers={suppliers}
            onChanged={load}
            canCreate={can(permissions, "SUPPLIERS", "CREATE")}
            canUpdate={can(permissions, "SUPPLIERS", "UPDATE")}
            canDelete={can(permissions, "SUPPLIERS", "DELETE")}
          />
        </div>
      )}

      {storeId && canReadOrders && (
        <PurchaseOrdersSection
          orders={orders}
          suppliers={suppliers}
          storeId={storeId}
          onChanged={load}
          canCreate={can(permissions, "PURCHASE_ORDERS", "CREATE")}
        />
      )}

      {canReadDeliveries && <DeliveriesSection deliveries={deliveries} onChanged={load} />}
    </div>
  );
}
