import { LoaderCircle } from "lucide-react";
import { useEffect, useState } from "react";

import { DeliveriesSection } from "@/components/purchasing/DeliveriesSection";
import { PurchaseOrdersSection } from "@/components/purchasing/PurchaseOrdersSection";
import { SuppliersSection } from "@/components/purchasing/SuppliersSection";
import { useDefaultStore } from "@/hooks/use-default-store";
import { api, ApiError, type Delivery, type PurchaseOrder, type Supplier } from "@/lib/api";
import { useI18n } from "@/lib/i18n";

export function PurchasingPage() {
  const { t } = useI18n();
  const { storeId, loading: storeLoading } = useDefaultStore();
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [orders, setOrders] = useState<PurchaseOrder[]>([]);
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    if (!storeId) return;
    setLoading(true);
    setError(null);
    try {
      const [supplierList, orderList, deliveryList] = await Promise.all([
        api.suppliers.list(),
        api.purchaseOrders.list(storeId),
        api.deliveries.list(storeId),
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

      <div className="mt-6">
        <SuppliersSection suppliers={suppliers} onChanged={load} />
      </div>

      {storeId && <PurchaseOrdersSection orders={orders} suppliers={suppliers} storeId={storeId} onChanged={load} />}

      <DeliveriesSection deliveries={deliveries} onChanged={load} />
    </div>
  );
}
