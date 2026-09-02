import { LayoutGrid, LoaderCircle, PackageSearch, Receipt, Truck } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useState, type FormEvent } from "react";

import logoUrl from "@/assets/images/logo.png";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { api, ApiError, type AuthUser } from "@/lib/api";
import { useI18n } from "@/lib/i18n";

interface LoginPageProps {
  onLoginSuccess: (user: AuthUser, accessToken: string) => void;
}

const listVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.05, delayChildren: 0.15 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 6 },
  show: { opacity: 1, y: 0, transition: { duration: 0.25, ease: "easeOut" } },
} as const;

export function LoginPage({ onLoginSuccess }: LoginPageProps) {
  const { t } = useI18n();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const capabilities = [
    { icon: LayoutGrid, label: t("login.cap1") },
    { icon: PackageSearch, label: t("login.cap2") },
    { icon: Truck, label: t("login.cap3") },
    { icon: Receipt, label: t("login.cap4") },
  ];

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const result = await api.login(email, password);
      onLoginSuccess(result.user, result.accessToken);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t("login.networkError"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="grid h-full overflow-y-auto lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)]">
      {/* Panneau de marque */}
      <div className="hidden bg-brand-panel px-16 py-14 text-brand-panel-foreground lg:flex lg:flex-col lg:justify-between">
        <div className="flex items-center gap-2.5">
          <img src={logoUrl} alt="" className="size-9" />
          <span className="text-lg font-semibold tracking-tight">{t("appName")}</span>
        </div>

        <div className="max-w-md space-y-4">
          <h1 className="text-3xl leading-tight font-semibold text-balance">{t("login.tagline")}</h1>
          <p className="text-sm leading-relaxed text-brand-panel-foreground/65">{t("login.pitch")}</p>
        </div>

        <motion.ul className="space-y-3.5" variants={listVariants} initial="hidden" animate="show">
          {capabilities.map(({ icon: Icon, label }) => (
            <motion.li
              key={label}
              variants={itemVariants}
              className="flex items-center gap-3 text-sm text-brand-panel-foreground/80"
            >
              <span className="flex size-7 shrink-0 items-center justify-center rounded-md bg-primary/25 text-primary-foreground">
                <Icon className="size-3.5" />
              </span>
              {label}
            </motion.li>
          ))}
        </motion.ul>
      </div>

      {/* Panneau de connexion */}
      <div className="flex items-center justify-center bg-background px-6 py-12">
        <div className="w-full max-w-sm">
          <div className="mb-8 flex items-center gap-2.5 lg:hidden">
            <img src={logoUrl} alt="" className="size-8" />
            <span className="text-lg font-semibold">{t("appName")}</span>
          </div>

          <h2 className="text-xl font-semibold text-foreground">{t("login.welcomeBack")}</h2>
          <p className="mt-1.5 text-sm text-muted-foreground">{t("login.subtitle")}</p>

          <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
            <div className="space-y-1.5">
              <Label htmlFor="email">{t("login.email")}</Label>
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
              <Label htmlFor="password">{t("login.password")}</Label>
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
                  transition={{ duration: 0.15 }}
                  className="overflow-hidden rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive"
                >
                  {error}
                </motion.p>
              )}
            </AnimatePresence>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading && <LoaderCircle className="animate-spin" />}
              {t("login.submit")}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
