import { Boxes, FileBarChart, LoaderCircle, ShieldCheck, ShoppingCart, TrendingUp, Truck, Users } from "lucide-react";
import { motion } from "motion/react";
import { useEffect, useState } from "react";

import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useDefaultStore } from "@/hooks/use-default-store";
import { api, type AuthUser, type Permission, type SalesSummary } from "@/lib/api";
import { formatCurrency } from "@/lib/format";
import { useI18n } from "@/lib/i18n";
import { canSeeTab } from "@/lib/permissions";
import type { NavTab } from "@/types/nav";

const MODULES: { tab: NavTab; icon: typeof Boxes; titleKey: string; descKey: string; tint: string }[] = [
  { tab: "caisse", icon: ShoppingCart, titleKey: "nav.caisse", descKey: "dashboard.caisseDesc", tint: "bg-gradient-to-br from-spectrum-coral to-spectrum-coral/70" },
  { tab: "catalogue", icon: Boxes, titleKey: "nav.catalogue", descKey: "dashboard.catalogueDesc", tint: "bg-gradient-to-br from-spectrum-amber to-spectrum-amber/70" },
  { tab: "achats", icon: Truck, titleKey: "nav.achats", descKey: "dashboard.achatsDesc", tint: "bg-gradient-to-br from-spectrum-violet to-spectrum-violet/70" },
  { tab: "clients", icon: Users, titleKey: "nav.clients", descKey: "dashboard.clientsDesc", tint: "bg-gradient-to-br from-spectrum-pink to-spectrum-pink/70" },
  { tab: "rapports", icon: FileBarChart, titleKey: "nav.rapports", descKey: "dashboard.rapportsDesc", tint: "bg-gradient-to-br from-spectrum-teal to-spectrum-teal/70" },
  { tab: "audit", icon: ShieldCheck, titleKey: "nav.audit", descKey: "dashboard.auditDesc", tint: "bg-gradient-to-br from-spectrum-azure to-spectrum-azure/70" },
];

const gridVariants = { hidden: {}, show: { transition: { staggerChildren: 0.04 } } };
const cardVariants = {
  hidden: { opacity: 0, y: 8 },
  show: { opacity: 1, y: 0, transition: { duration: 0.2, ease: "easeOut" } },
} as const;

interface DashboardPageProps {
  user: AuthUser;
  permissions: Permission[];
  onNavigate: (tab: NavTab) => void;
}

export function DashboardPage({ user, permissions, onNavigate }: DashboardPageProps) {
  const { t } = useI18n();
  const { storeId } = useDefaultStore();
  const [summary, setSummary] = useState<SalesSummary | null>(null);
  const [summaryDenied, setSummaryDenied] = useState(false);
  const visibleModules = MODULES.filter((m) => canSeeTab(permissions, m.tab));

  useEffect(() => {
    if (!storeId) return;
    api.reports.salesSummary(storeId).then(setSummary).catch(() => setSummaryDenied(true));
  }, [storeId]);

  return (
    <div className="mx-auto max-w-4xl px-10 py-12">
      <p className="text-sm font-medium text-primary">{t("dashboard.eyebrow")}</p>
      <h1 className="mt-1 text-2xl font-semibold text-foreground">
        {t("dashboard.greeting")}, {user.firstName}
      </h1>
      <p className="mt-2 max-w-lg text-sm leading-relaxed text-muted-foreground">{t("dashboard.subtitle")}</p>

      {!summaryDenied && (
        <div className="mt-6 flex items-center gap-2 text-sm text-muted-foreground">
          {summary ? (
            <>
              <TrendingUp className="size-4 text-primary" />
              <span>
                <span className="font-semibold text-foreground">{summary.salesCount}</span>{" "}
                {summary.salesCount === 1 ? t("dashboard.salesSuffix") : t("dashboard.salesSuffixPlural")} ·{" "}
                <span className="font-semibold text-foreground">{formatCurrency(summary.totalRevenue)}</span>{" "}
                {t("dashboard.revenueSuffix")}
              </span>
            </>
          ) : (
            <LoaderCircle className="size-4 animate-spin" />
          )}
        </div>
      )}

      <motion.div
        className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
        variants={gridVariants}
        initial="hidden"
        animate="show"
      >
        {visibleModules.map(({ tab, icon: Icon, titleKey, descKey, tint }) => (
          <motion.button
            key={tab}
            type="button"
            onClick={() => onNavigate(tab)}
            variants={cardVariants}
            className="text-left"
          >
            <Card className="border-border/80 py-5 transition-colors hover:border-primary/40">
              <CardHeader className="gap-2 px-5">
                <div className={`flex size-9 items-center justify-center rounded-md text-white ${tint}`}>
                  <Icon className="size-4.5" />
                </div>
                <CardTitle className="text-sm font-semibold">{t(titleKey)}</CardTitle>
                <CardDescription className="text-xs leading-relaxed">{t(descKey)}</CardDescription>
              </CardHeader>
            </Card>
          </motion.button>
        ))}
      </motion.div>
    </div>
  );
}
