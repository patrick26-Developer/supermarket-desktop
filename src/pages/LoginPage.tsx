import { LayoutGrid, LoaderCircle, PackageSearch, Receipt, Store, Truck } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useState, type FormEvent } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { api, ApiError, type AuthUser } from "@/lib/api";

interface LoginPageProps {
  onLoginSuccess: (user: AuthUser, accessToken: string) => void;
}

const CAPABILITIES = [
  { icon: LayoutGrid, label: "Caisse & ventes multi-magasins" },
  { icon: PackageSearch, label: "Stock, achats & inventaires en temps réel" },
  { icon: Truck, label: "Clients, livraisons & suivi de statut" },
  { icon: Receipt, label: "Journal d'audit & rapports consolidés" },
];

const listVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06, delayChildren: 0.35 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 8 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: "easeOut" } },
} as const;

export function LoginPage({ onLoginSuccess }: LoginPageProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const result = await api.login(email, password);
      onLoginSuccess(result.user, result.accessToken);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Impossible de contacter le serveur");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="grid h-full overflow-y-auto lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)]">
      {/* Panneau de marque */}
      <div className="relative hidden overflow-hidden bg-brand-panel px-16 py-14 text-brand-panel-foreground lg:flex lg:flex-col lg:justify-between">
        <motion.div
          aria-hidden
          className="pointer-events-none absolute -top-32 -left-24 size-[32rem] rounded-full bg-[oklch(0.68_0.15_45/0.18)] blur-3xl"
          animate={{ x: [0, 24, 0], y: [0, 16, 0] }}
          transition={{ duration: 22, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          aria-hidden
          className="pointer-events-none absolute -right-40 bottom-[-8rem] size-[28rem] rounded-full bg-[oklch(0.98_0.008_85/0.08)] blur-3xl"
          animate={{ x: [0, -20, 0], y: [0, -14, 0] }}
          transition={{ duration: 26, repeat: Infinity, ease: "easeInOut" }}
        />

        <motion.div
          className="relative flex items-center gap-2.5"
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
        >
          <div className="flex size-9 items-center justify-center rounded-lg bg-brand-panel-foreground/10">
            <Store className="size-5" />
          </div>
          <span className="font-display text-lg font-medium tracking-tight">Superette</span>
        </motion.div>

        <motion.div
          className="relative max-w-md space-y-6"
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut", delay: 0.1 }}
        >
          <h1 className="font-display text-[2.75rem] leading-[1.08] font-medium text-balance">
            La gestion de votre superette, sans friction.
          </h1>
          <p className="text-base leading-relaxed text-brand-panel-foreground/70">
            Une seule plateforme pour la caisse, le stock, les achats fournisseurs et les
            livraisons — pensée pour les commerces de proximité.
          </p>
        </motion.div>

        <motion.ul
          className="relative space-y-4"
          variants={listVariants}
          initial="hidden"
          animate="show"
        >
          {CAPABILITIES.map(({ icon: Icon, label }) => (
            <motion.li
              key={label}
              variants={itemVariants}
              className="flex items-center gap-3 text-sm text-brand-panel-foreground/80"
            >
              <span className="flex size-8 shrink-0 items-center justify-center rounded-md bg-brand-panel-foreground/10">
                <Icon className="size-4" />
              </span>
              {label}
            </motion.li>
          ))}
        </motion.ul>
      </div>

      {/* Panneau de connexion */}
      <div className="flex items-center justify-center bg-background px-6 py-12">
        <motion.div
          className="w-full max-w-sm"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: "easeOut", delay: 0.1 }}
        >
          <div className="mb-8 flex items-center gap-2.5 lg:hidden">
            <Store className="size-6 text-primary" />
            <span className="font-display text-lg font-medium">Superette</span>
          </div>

          <h2 className="font-display text-2xl font-medium text-foreground">Bon retour</h2>
          <p className="mt-1.5 text-sm text-muted-foreground">
            Connectez-vous pour accéder à votre poste de caisse.
          </p>

          <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                autoComplete="username"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@superette.local"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password">Mot de passe</Label>
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
              />
            </div>

            <AnimatePresence>
              {error && (
                <motion.p
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive"
                >
                  {error}
                </motion.p>
              )}
            </AnimatePresence>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading && <LoaderCircle className="animate-spin" />}
              Se connecter
            </Button>
          </form>
        </motion.div>
      </div>
    </div>
  );
}
