import { LoaderCircle, ShieldCheck } from "lucide-react";
import { useEffect, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { api, ApiError, type AuditLog } from "@/lib/api";
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
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [action, setAction] = useState("");
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

  return (
    <div className="mx-auto max-w-5xl px-10 py-10">
      <p className="text-sm font-medium text-primary">Journal d'audit</p>
      <h1 className="mt-1 text-2xl font-semibold text-foreground">Activité du système</h1>

      <select
        value={action}
        onChange={(e) => setAction(e.target.value)}
        className="mt-6 flex h-9 w-56 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
      >
        <option value="">Toutes les actions</option>
        {ACTIONS.map((a) => (
          <option key={a} value={a}>
            {a}
          </option>
        ))}
      </select>

      {error && <p className="mt-4 text-sm text-destructive">{error}</p>}

      <div className="mt-4 overflow-hidden rounded-lg border border-border bg-card">
        {loading ? (
          <div className="flex items-center justify-center py-16 text-muted-foreground">
            <LoaderCircle className="size-5 animate-spin" />
          </div>
        ) : logs.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-16 text-center text-muted-foreground">
            <ShieldCheck className="size-8" />
            <p className="text-sm">Aucune entrée.</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs text-muted-foreground uppercase">
                <th className="px-4 py-3 font-medium">Date</th>
                <th className="px-4 py-3 font-medium">Action</th>
                <th className="px-4 py-3 font-medium">Ressource</th>
                <th className="px-4 py-3 font-medium">Description</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((l) => (
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
