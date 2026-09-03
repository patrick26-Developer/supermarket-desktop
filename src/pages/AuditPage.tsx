import { LoaderCircle, Search, ShieldCheck } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { api, ApiError, type AuditLog } from "@/lib/api";
import { useI18n } from "@/lib/i18n";
import { formatDate } from "@/lib/format";

const ACTIONS = [
  "CREATE",
  "READ",
  "UPDATE",
  "DELETE",
  "LOGIN",
  "LOGOUT",
  "APPROVE",
  "CANCEL",
  "REFUND",
  "OPEN_SESSION",
  "CLOSE_SESSION",
  "STOCK_ADJUSTMENT",
  "PAYMENT",
  "OTHER",
];

const ACTION_TONE: Record<string, "neutral" | "primary" | "accent" | "success" | "destructive"> = {
  CREATE: "success",
  DELETE: "destructive",
  CANCEL: "destructive",
  REFUND: "destructive",
  APPROVE: "primary",
  LOGIN: "accent",
  LOGOUT: "neutral",
};

export function AuditPage() {
  const { t } = useI18n();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [action, setAction] = useState("");
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    api.auditLogs
      .list({ action: action || undefined, limit: 100 })
      .then(setLogs)
      .catch((err) => setError(err instanceof ApiError ? err.message : "Impossible de contacter le serveur"))
      .finally(() => setLoading(false));
  }, [action]);

  const resources = useMemo(() => [...new Set(logs.map((l) => l.resource))].sort(), [logs]);
  const [resource, setResource] = useState("");

  const filtered = useMemo(() => {
    return logs
      .filter((l) => !resource || l.resource === resource)
      .filter((l) => !query || (l.description ?? "").toLowerCase().includes(query.toLowerCase()));
  }, [logs, resource, query]);

  return (
    <div className="mx-auto max-w-5xl px-10 py-10">
      <p className="text-sm font-medium text-primary">{t("audit.eyebrow")}</p>
      <h1 className="mt-1 text-2xl font-semibold text-foreground">{t("audit.title")}</h1>

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <select
          value={action}
          onChange={(e) => setAction(e.target.value)}
          className="flex h-9 w-56 rounded-md border border-input bg-transparent px-3 py-1 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
        >
          <option value="">{t("audit.allActions")}</option>
          {ACTIONS.map((a) => (
            <option key={a} value={a}>
              {a}
            </option>
          ))}
        </select>
        <select
          value={resource}
          onChange={(e) => setResource(e.target.value)}
          className="flex h-9 w-56 rounded-md border border-input bg-transparent px-3 py-1 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
        >
          <option value="">{t("audit.allResources")}</option>
          {resources.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </select>
        <div className="relative">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder={t("audit.searchPlaceholder")} className="w-64 pl-9" />
        </div>
      </div>

      {error && <p className="mt-4 text-sm text-destructive">{error}</p>}

      <div className="mt-4 overflow-hidden rounded-lg border border-border bg-card">
        {loading ? (
          <div className="flex items-center justify-center py-16 text-muted-foreground">
            <LoaderCircle className="size-5 animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-16 text-center text-muted-foreground">
            <ShieldCheck className="size-8" />
            <p className="text-sm">{t("audit.noEntries")}</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs text-muted-foreground uppercase">
                <th className="px-4 py-3 font-medium">{t("audit.colDate")}</th>
                <th className="px-4 py-3 font-medium">{t("audit.colAction")}</th>
                <th className="px-4 py-3 font-medium">{t("audit.colResource")}</th>
                <th className="px-4 py-3 font-medium">{t("audit.colDescription")}</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((l) => (
                <tr key={l.id} className="border-b border-border last:border-0">
                  <td className="px-4 py-3 whitespace-nowrap text-muted-foreground">{formatDate(l.createdAt)}</td>
                  <td className="px-4 py-3">
                    <Badge tone={ACTION_TONE[l.action] ?? "neutral"}>{l.action}</Badge>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{l.resource}</td>
                  <td className="px-4 py-3 text-foreground">{l.description ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
