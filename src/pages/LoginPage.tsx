import { LayoutGrid, LoaderCircle, PackageSearch, Receipt, Truck } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useState, type FormEvent } from "react";

import logoUrl from "@/assets/images/logo.png";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
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

const CAPABILITY_TINTS = [
  "bg-spectrum-coral/70",
  "bg-spectrum-teal/70",
  "bg-spectrum-amber/70",
  "bg-spectrum-violet/70",
];

export function LoginPage({ onLoginSuccess }: LoginPageProps) {
  const { t } = useI18n();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showForgotPassword, setShowForgotPassword] = useState(false);

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
      <div className="relative hidden overflow-hidden bg-brand-panel px-16 py-14 text-brand-panel-foreground lg:flex lg:flex-col lg:justify-between">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-70"
          style={{
            backgroundImage:
              "radial-gradient(ellipse 60% 50% at 15% 0%, color-mix(in oklab, var(--primary) 55%, transparent), transparent), radial-gradient(ellipse 55% 45% at 100% 100%, color-mix(in oklab, var(--accent) 45%, transparent), transparent), radial-gradient(ellipse 40% 35% at 90% 10%, color-mix(in oklab, var(--spectrum-coral) 35%, transparent), transparent)",
          }}
        />
        <div className="relative flex items-center gap-2.5">
          <img src={logoUrl} alt="" className="size-9" />
          <span className="text-lg font-semibold tracking-tight">{t("appName")}</span>
        </div>

        <div className="relative max-w-md space-y-4">
          <h1 className="text-3xl leading-tight font-semibold text-balance">{t("login.tagline")}</h1>
          <p className="text-sm leading-relaxed text-brand-panel-foreground/65">{t("login.pitch")}</p>
        </div>

        <motion.ul className="relative space-y-3.5" variants={listVariants} initial="hidden" animate="show">
          {capabilities.map(({ icon: Icon, label }, index) => (
            <motion.li
              key={label}
              variants={itemVariants}
              className="flex items-center gap-3 text-sm text-brand-panel-foreground/80"
            >
              <span className={`flex size-7 shrink-0 items-center justify-center rounded-md text-white ${CAPABILITY_TINTS[index % CAPABILITY_TINTS.length]}`}>
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
              <div className="flex items-center justify-between">
                <Label htmlFor="password">{t("login.password")}</Label>
                <button
                  type="button"
                  onClick={() => setShowForgotPassword(true)}
                  className="text-xs font-medium text-primary hover:underline"
                >
                  {t("login.forgotPassword")}
                </button>
              </div>
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

      <Dialog open={showForgotPassword} onOpenChange={setShowForgotPassword}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("login.forgotPassword")}</DialogTitle>
          </DialogHeader>
          <p className="mt-2 text-sm text-muted-foreground">{t("settings.forgotPasswordInfo")}</p>
        </DialogContent>
      </Dialog>
    </div>
  );
}
