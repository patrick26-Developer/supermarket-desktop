import { Boxes, FileBarChart, ShoppingCart, Truck } from "lucide-react";
import { motion } from "motion/react";

import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { AuthUser } from "@/lib/api";

const UPCOMING_MODULES = [
  {
    icon: ShoppingCart,
    title: "Caisse",
    description: "Recherche produit, panier, encaissement espèces/mobile money.",
  },
  {
    icon: Boxes,
    title: "Catalogue & stock",
    description: "Produits, prix par magasin, mouvements de stock en direct.",
  },
  {
    icon: Truck,
    title: "Achats & livraisons",
    description: "Commandes fournisseurs, réceptions, suivi de livraison client.",
  },
  {
    icon: FileBarChart,
    title: "Rapports",
    description: "Ventes, valorisation du stock, produits les plus vendus.",
  },
];

const gridVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06, delayChildren: 0.1 } },
};

const cardVariants = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0, transition: { duration: 0.3, ease: "easeOut" } },
} as const;

interface DashboardPageProps {
  user: AuthUser;
}

export function DashboardPage({ user }: DashboardPageProps) {
  return (
    <div className="mx-auto max-w-4xl px-10 py-12">
      <p className="text-sm font-medium text-accent">Tableau de bord</p>
      <h1 className="mt-1 font-display text-3xl font-medium text-foreground">
        Bonjour, {user.firstName}
      </h1>
      <p className="mt-2 max-w-lg text-sm leading-relaxed text-muted-foreground">
        La connexion à l'API est confirmée. Les écrans métier ci-dessous arrivent
        prochainement — le backend qui les alimente est déjà opérationnel.
      </p>

      <motion.div
        className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2"
        variants={gridVariants}
        initial="hidden"
        animate="show"
      >
        {UPCOMING_MODULES.map(({ icon: Icon, title, description }) => (
          <motion.div key={title} variants={cardVariants}>
            <Card className="border-border/80 py-5 shadow-none">
              <CardHeader className="gap-2 px-5">
                <div className="flex size-9 items-center justify-center rounded-md bg-secondary text-secondary-foreground">
                  <Icon className="size-4.5" />
                </div>
                <CardTitle className="text-sm font-semibold">{title}</CardTitle>
                <CardDescription className="text-xs leading-relaxed">{description}</CardDescription>
              </CardHeader>
            </Card>
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
}
