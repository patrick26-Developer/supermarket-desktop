import { Info, Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useTheme } from "@/hooks/use-theme";
import { api, type AuthUser } from "@/lib/api";
import { formatDate } from "@/lib/format";
import { useI18n } from "@/lib/i18n";

interface SettingsPageProps {
  user: AuthUser;
}

export function SettingsPage({ user }: SettingsPageProps) {
  const { t, lang, setLang } = useI18n();
  const { theme, toggle: toggleTheme } = useTheme();
  const [createdAt, setCreatedAt] = useState<string | null>(null);

  useEffect(() => {
    api.auth.profile().then((p) => setCreatedAt(p.createdAt ?? null)).catch(() => {});
  }, []);

  return (
    <div className="mx-auto max-w-2xl px-10 py-10">
      <p className="text-sm font-medium text-primary">{t("settings.eyebrow")}</p>
      <h1 className="mt-1 text-2xl font-semibold text-foreground">{t("settings.title")}</h1>

      <div className="mt-8 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>{t("settings.appearance")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-foreground">{t("settings.theme")}</span>
              <button
                type="button"
                onClick={toggleTheme}
                className="flex items-center gap-2 rounded-md border border-input px-3 py-1.5 text-sm transition-colors hover:bg-secondary"
              >
                {theme === "dark" ? <Moon className="size-3.5" /> : <Sun className="size-3.5" />}
                {theme === "dark" ? t("settings.themeDark") : t("settings.themeLight")}
              </button>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-foreground">{t("settings.language")}</span>
              <div className="inline-flex rounded-md border border-input p-0.5 text-xs font-medium">
                {(["fr", "en"] as const).map((l) => (
                  <button
                    key={l}
                    type="button"
                    onClick={() => setLang(l)}
                    className={`rounded px-3 py-1 transition-colors ${
                      lang === l
                        ? "bg-gradient-to-r from-primary to-accent text-primary-foreground"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {l.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t("settings.account")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-foreground">{t("settings.role")}</span>
              <div className="flex flex-wrap justify-end gap-1">
                {user.roles.map((r) => (
                  <Badge key={r} tone="primary">
                    {r}
                  </Badge>
                ))}
              </div>
            </div>
            {createdAt && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-foreground">{t("settings.memberSince")}</span>
                <span className="text-sm text-muted-foreground">{formatDate(createdAt)}</span>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="flex items-start gap-2.5 rounded-lg border border-border bg-secondary/40 p-4 text-sm text-muted-foreground">
          <Info className="mt-0.5 size-4 shrink-0" />
          <p>{t("settings.forgotPasswordInfo")}</p>
        </div>
      </div>
    </div>
  );
}
