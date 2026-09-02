import { Boxes, FileBarChart, LoaderCircle, ShieldCheck, ShoppingCart, TrendingUp, Truck, Users } from "lucide-react";
import { motion } from "motion/react";
import { useEffect, useState } from "react";

import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useDefaultStore } from "@/hooks/use-default-store";
import { api, type AuthUser, type SalesSummary } from "@/lib/api";
import { formatCurrency } from "@/lib/format";
import type { NavTab } from "@/types/nav";

const MODULES: { tab: NavTab; icon: typeof Boxes; title: string; description: string; tint: string }[] = [
  {
    tab: "caisse",
    icon: ShoppingCart,
    title: "Caisse",
    description: "Recherche produit, panier, encaissement.",
    tint: "bg-primary/10 text-primary",
  },
  {
    tab: "catalogue",
    icon: Boxes,
    title: "Catalogue & stock",
    description: "Produits, catégories, niveaux de stock.",
    tint: "bg-accent/15 text-accent-foreground",
  },
  {
    tab: "achats",
    icon: Truck,
    title: "Achats & livraisons",
    description: "Fournisseurs, commandes, réceptions, livraisons.",
    tint: "bg-secondary text-secondary-foreground",
  },
  {
    tab: "clients",
    icon: Users,
    title: "Clients",
    description: "Clientèle particulière et entreprise.",
    tint: "bg-primary/10 text-primary",
  },
  {
    tab: "rapports",
    icon: FileBarChart,
    title: "Rapports",
    description: "Ventes, valorisation du stock, top produits.",
    tint: "bg-accent/15 text-accent-foreground",
  },
  {
    tab: "audit",
    icon: ShieldCheck,
    title: "Journal d'audit",
    description: "Historique des actions sensibles.",
    tint: "bg-secondary text-secondary-foreground",
  },
];

const gridVariants = { hidden: {}, show: { transition: { staggerChildren: 0.04 } } };
const cardVariants = {
  hidden: { opacity: 0, y: 8 },
  show: { opacity: 1, y: 0, transition: { duration: 0.2, ease: "easeOut" } },
} as const;

interface DashboardPageProps {
  user: AuthUser;
  onNavigate: (tab: NavTab) => void;
}

export function DashboardPage({ user, onNavigate }: DashboardPageProps) {
  const { storeId } = useDefaultStore();
  const [summary, setSummary] = useState<SalesSummary | null>(null);

  useEffect(() => {
    if (!storeId) return;
    api.reports.salesSummary(storeId).then(setSummary).catch(() => {});
  }, [storeId]);

  return (
    <div className="mx-auto max-w-4xl px-10 py-12">
      <p className="text-sm font-medium text-primary">Tableau de bord</p>
      <h1 className="mt-1 text-2xl font-semibold text-foreground">Bonjour, {user.firstName}</h1>
      <p className="mt-2 max-w-lg text-sm leading-relaxed text-muted-foreground">
        Tous les modules sont opérationnels et connectés au backend.
      </p>

      <div className="mt-6 flex items-center gap-2 text-sm text-muted-foreground">
        {summary ? (
          <>
            <TrendingUp className="size-4 text-primary" />
            <span>
              <span className="font-semibold text-foreground">{summary.salesCount}</span> vente
              {summary.salesCount === 1 ? "" : "s"} ·{" "}
              <span className="font-semibold text-foreground">{formatCurrency(summary.totalRevenue)}</span> de
              chiffre d'affaires cumulé
            </span>
          </>
        ) : (
          <LoaderCircle className="size-4 animate-spin" />
        )}
      </div>

      <motion.div
        className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
        variants={gridVariants}
        initial="hidden"
        animate="show"
      >
        {MODULES.map(({ tab, icon: Icon, title, description, tint }) => (
          <motion.button
            key={tab}
            type="button"
            onClick={() => onNavigate(tab)}
            variants={cardVariants}
            className="text-left"
          >
            <Card className="border-border/80 py-5 shadow-none transition-colors hover:border-primary/40">
              <CardHeader className="gap-2 px-5">
                <div className={`flex size-9 items-center justify-center rounded-md ${tint}`}>
                  <Icon className="size-4.5" />
                </div>
                <CardTitle className="text-sm font-semibold">{title}</CardTitle>
                <CardDescription className="text-xs leading-relaxed">{description}</CardDescription>
              </CardHeader>
            </Card>
          </motion.button>
        ))}
      </motion.div>
    </div>
  );
}
