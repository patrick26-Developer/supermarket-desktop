import { LayoutGrid, LoaderCircle, PackageSearch, Receipt, Store, Truck } from "lucide-react";
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
    <div className="grid min-h-screen lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)]">
      {/* Panneau de marque */}
      <div className="relative hidden overflow-hidden bg-brand-panel px-16 py-14 text-brand-panel-foreground lg:flex lg:flex-col lg:justify-between">
        <div
          aria-hidden
          className="pointer-events-none absolute -top-32 -left-24 size-[32rem] rounded-full bg-[oklch(0.68_0.15_45/0.18)] blur-3xl"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -right-40 bottom-[-8rem] size-[28rem] rounded-full bg-[oklch(0.98_0.008_85/0.08)] blur-3xl"
        />

        <div className="relative flex items-center gap-2.5">
          <div className="flex size-9 items-center justify-center rounded-lg bg-brand-panel-foreground/10">
            <Store className="size-5" />
          </div>
          <span className="font-display text-lg font-medium tracking-tight">Superette</span>
        </div>

        <div className="relative max-w-md space-y-6">
          <h1 className="font-display text-[2.75rem] leading-[1.08] font-medium text-balance">
            La gestion de votre superette, sans friction.
          </h1>
          <p className="text-base leading-relaxed text-brand-panel-foreground/70">
            Une seule plateforme pour la caisse, le stock, les achats fournisseurs et les
            livraisons — pensée pour les commerces de proximité.
          </p>
        </div>

        <ul className="relative space-y-4">
          {CAPABILITIES.map(({ icon: Icon, label }) => (
            <li key={label} className="flex items-center gap-3 text-sm text-brand-panel-foreground/80">
              <span className="flex size-8 shrink-0 items-center justify-center rounded-md bg-brand-panel-foreground/10">
                <Icon className="size-4" />
              </span>
              {label}
            </li>
          ))}
        </ul>
      </div>

      {/* Panneau de connexion */}
      <div className="flex items-center justify-center bg-background px-6 py-12">
        <div className="w-full max-w-sm">
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

            {error && (
              <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {error}
              </p>
            )}

            <Button type="submit" className="w-full" disabled={loading}>
              {loading && <LoaderCircle className="animate-spin" />}
              Se connecter
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
