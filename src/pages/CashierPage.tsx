import { CheckCircle2, LoaderCircle, LockKeyhole } from "lucide-react";
import { useEffect, useState } from "react";

import { CartPanel } from "@/components/pos/CartPanel";
import { ProductSearch } from "@/components/pos/ProductSearch";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useCart } from "@/hooks/use-cart";
import { api, ApiError, type CashierSession, type CashRegister } from "@/lib/api";
import { formatCurrency } from "@/lib/format";
import { useI18n } from "@/lib/i18n";

type BootStatus = "loading" | "no-register" | "needs-open" | "ready" | "error";

export function CashierPage() {
  const { t } = useI18n();
  const [status, setStatus] = useState<BootStatus>("loading");
  const [bootError, setBootError] = useState<string | null>(null);
  const [register, setRegister] = useState<CashRegister | null>(null);
  const [session, setSession] = useState<CashierSession | null>(null);
  const [stockByProduct, setStockByProduct] = useState<Map<string, number>>(new Map());

  const [openingAmount, setOpeningAmount] = useState("0");
  const [opening, setOpening] = useState(false);

  const cart = useCart();
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [lastSale, setLastSale] = useState<{ reference: string; total: number } | null>(null);

  async function bootstrap() {
    setStatus("loading");
    setBootError(null);
    try {
      const registers = await api.cashRegisters.list();
      const activeRegister = registers.find((r) => r.status === "ACTIVE") ?? registers[0];
      if (!activeRegister) {
        setStatus("no-register");
        return;
      }
      setRegister(activeRegister);

      const openSessions = await api.cashSessions.findOpen(activeRegister.id);
      if (openSessions.length > 0) {
        setSession(openSessions[0]);
        const stock = await api.stock.listByStore(activeRegister.storeId);
        setStockByProduct(new Map(stock.map((s) => [s.productId, Number(s.availableQty)])));
        setStatus("ready");
      } else {
        setStatus("needs-open");
      }
    } catch (err) {
      setBootError(err instanceof ApiError ? err.message : "Impossible de contacter le serveur");
      setStatus("error");
    }
  }

  useEffect(() => {
    bootstrap();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleOpenSession() {
    if (!register) return;
    setOpening(true);
    setBootError(null);
    try {
      const newSession = await api.cashSessions.open(register.id, Number(openingAmount));
      setSession(newSession);
      const stock = await api.stock.listByStore(register.storeId);
      setStockByProduct(new Map(stock.map((s) => [s.productId, Number(s.availableQty)])));
      setStatus("ready");
    } catch (err) {
      setBootError(err instanceof ApiError ? err.message : "Impossible d'ouvrir la caisse");
    } finally {
      setOpening(false);
    }
  }

  async function handleCheckout(method: string, forceFailure: boolean) {
    if (!register || !session) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      const sale = await api.sales.create({
        storeId: register.storeId,
        sessionId: session.id,
        items: cart.lines.map((l) => ({
          productId: l.product.id,
          quantity: l.quantity,
          unitPrice: l.unitPrice,
        })),
        payments: [{ method, amount: cart.totals.total, forceFailure }],
      });
      setLastSale({ reference: sale.reference, total: Number(sale.totalAmount) });
      cart.clear();
      const stock = await api.stock.listByStore(register.storeId);
      setStockByProduct(new Map(stock.map((s) => [s.productId, Number(s.availableQty)])));
      setTimeout(() => setLastSale(null), 5000);
    } catch (err) {
      setSubmitError(err instanceof ApiError ? err.message : "La vente a échoué");
    } finally {
      setSubmitting(false);
    }
  }

  if (status === "loading") {
    return (
      <div className="flex h-full items-center justify-center text-muted-foreground">
        <LoaderCircle className="size-5 animate-spin" />
      </div>
    );
  }

  if (status === "no-register") {
    return (
      <div className="flex h-full items-center justify-center px-10 text-center">
        <div className="max-w-sm space-y-2">
          <p className="font-medium text-foreground">{t("caisse.noRegisterTitle")}</p>
          <p className="text-sm text-muted-foreground">{t("caisse.noRegisterDesc")}</p>
        </div>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="flex h-full items-center justify-center px-10 text-center">
        <p className="text-sm text-destructive">{bootError}</p>
      </div>
    );
  }

  if (status === "needs-open" && register) {
    return (
      <div className="flex h-full items-center justify-center px-6">
        <div className="w-full max-w-sm rounded-lg border border-border bg-card p-6 shadow-xs">
          <div className="flex size-10 items-center justify-center rounded-md bg-primary/10 text-primary">
            <LockKeyhole className="size-5" />
          </div>
          <p className="mt-3 font-medium text-foreground">
            {t("caisse.openRegister")} {register.name}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">{t("caisse.openRegisterHint")}</p>
          <div className="mt-4 space-y-1.5">
            <Label htmlFor="opening-amount">{t("caisse.openingAmount")}</Label>
            <Input
              id="opening-amount"
              type="number"
              min="0"
              value={openingAmount}
              onChange={(e) => setOpeningAmount(e.target.value)}
            />
          </div>
          {bootError && <p className="mt-3 text-sm text-destructive">{bootError}</p>}
          <Button className="mt-4 w-full" onClick={handleOpenSession} disabled={opening}>
            {opening && <LoaderCircle className="animate-spin" />}
            {t("caisse.openRegister")}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="grid h-full grid-cols-[1fr_22rem] overflow-hidden">
      <div className="overflow-hidden border-r border-border p-6">
        <ProductSearch stockByProduct={stockByProduct} onAdd={cart.addProduct} />
      </div>
      <div className="flex flex-col overflow-hidden bg-card p-5">
        {lastSale && (
          <div className="mb-4 flex items-center gap-2 rounded-md bg-primary/10 px-3 py-2 text-sm text-primary">
            <CheckCircle2 className="size-4 shrink-0" />
            <span>
              {t("caisse.saleRegistered")} {lastSale.reference} — {formatCurrency(lastSale.total)}
            </span>
          </div>
        )}
        <CartPanel
          lines={cart.lines}
          totals={cart.totals}
          onUpdateQuantity={cart.updateQuantity}
          onUpdateUnitPrice={cart.updateUnitPrice}
          onRemove={cart.removeLine}
          onCheckout={handleCheckout}
          submitting={submitting}
          submitError={submitError}
        />
      </div>
    </div>
  );
}
