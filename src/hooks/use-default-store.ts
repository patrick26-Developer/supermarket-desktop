import { useEffect, useState } from "react";

import { api, ApiError } from "@/lib/api";

/**
 * Dérive le magasin courant depuis la première caisse active — il n'existe
 * pas encore d'endpoint /stores ni de sélecteur multi-magasin côté backend
 * (V1 mono-magasin assumée, voir docs/ROADMAP.md du backend). Réutilisé par
 * tous les onglets qui ont besoin d'un storeId.
 */
export function useDefaultStore() {
  const [storeId, setStoreId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    api.cashRegisters
      .list()
      .then((registers) => {
        if (cancelled) return;
        const active = registers.find((r) => r.status === "ACTIVE") ?? registers[0];
        setStoreId(active?.storeId ?? null);
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof ApiError ? err.message : "Erreur réseau");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return { storeId, loading, error };
}
