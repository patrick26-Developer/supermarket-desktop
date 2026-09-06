import { LoaderCircle } from "lucide-react";
import { useEffect, useState } from "react";

import { GoodsReceiptsSection } from "@/components/stock/GoodsReceiptsSection";
import { InventoryCountsSection } from "@/components/stock/InventoryCountsSection";
import { useDefaultStore } from "@/hooks/use-default-store";
import { api, ApiError, type GoodsReceipt, type InventoryCount, type Permission } from "@/lib/api";
import { useI18n } from "@/lib/i18n";
import { can } from "@/lib/permissions";

export function StockPage({ permissions }: { permissions: Permission[] }) {
  const { t } = useI18n();
  const { storeId, loading: storeLoading } = useDefaultStore();
  const [receipts, setReceipts] = useState<GoodsReceipt[]>([]);
  const [counts, setCounts] = useState<InventoryCount[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const canReadReceipts = can(permissions, "GOODS_RECEIPTS", "READ");
  const canReadCounts = can(permissions, "INVENTORIES", "READ");

  async function load() {
    if (!storeId) {
      // storeId ne se résout jamais pour un rôle sans CASH_REGISTERS:READ —
      // voir useDefaultStore et l'entrée PROGRESS.md du 2026-09-05.
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const [receiptList, countList] = await Promise.all([
        canReadReceipts ? api.goodsReceipts.list(storeId) : Promise.resolve([]),
        canReadCounts ? api.inventoryCounts.list(storeId) : Promise.resolve([]),
      ]);
      setReceipts(receiptList);
      setCounts(countList);
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

  if (storeLoading || loading) {
    return (
      <div className="flex h-full items-center justify-center text-muted-foreground">
        <LoaderCircle className="size-5 animate-spin" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-10 py-10 pb-16">
      <p className="text-sm font-medium text-primary">{t("stock.eyebrow")}</p>
      <h1 className="mt-1 text-2xl font-semibold text-foreground">{t("stock.title")}</h1>

      {error && <p className="mt-3 text-sm text-destructive">{error}</p>}

      {canReadReceipts && storeId && (
        <div className="mt-6">
          <GoodsReceiptsSection
            receipts={receipts}
            storeId={storeId}
            onChanged={load}
            canCreate={can(permissions, "GOODS_RECEIPTS", "CREATE")}
          />
        </div>
      )}

      {canReadCounts && storeId && (
        <InventoryCountsSection
          counts={counts}
          storeId={storeId}
          onChanged={load}
          canCreate={can(permissions, "INVENTORIES", "CREATE")}
          canApprove={can(permissions, "INVENTORIES", "APPROVE")}
          canCancel={can(permissions, "INVENTORIES", "UPDATE")}
        />
      )}
    </div>
  );
}
