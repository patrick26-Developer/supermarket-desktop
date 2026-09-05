import type { Permission } from "@/lib/api";
import type { NavTab } from "@/types/nav";

/**
 * Vérifie qu'une des permissions de l'utilisateur couvre (resource, action).
 * Utilisé côté client pour n'afficher que les onglets/actions réellement
 * autorisés — la vérification qui compte reste toujours côté serveur
 * (`@RequirePermission`), ceci n'est qu'un filtre d'affichage.
 */
export function can(permissions: Permission[], resource: string, action: string): boolean {
  return permissions.some((p) => p.resource === resource && p.action === action);
}

/** Vrai si au moins une des actions listées est accordée sur cette resource. */
export function canAny(permissions: Permission[], resource: string, actions: string[]): boolean {
  return actions.some((action) => can(permissions, resource, action));
}

/**
 * Permissions de lecture qui conditionnent l'affichage de chaque onglet —
 * `dashboard`/`profile`/`settings` en sont absents, toujours visibles.
 * Reflète ROLE_GRANTS côté backend (src/prisma/seed.ts) : un onglet
 * apparaît dès que le rôle a au moins UN des droits de lecture listés (ex.
 * "achats" regroupe Fournisseurs, Commandes ET Livraisons — un Livreur n'a
 * que DELIVERIES:READ mais doit quand même voir l'onglet pour accéder à
 * ses livraisons).
 */
export const TAB_PERMISSION: Partial<Record<NavTab, { resource: string; action: string }[]>> = {
  caisse: [{ resource: "SALES", action: "READ" }],
  catalogue: [{ resource: "PRODUCTS", action: "READ" }],
  achats: [
    { resource: "SUPPLIERS", action: "READ" },
    { resource: "PURCHASE_ORDERS", action: "READ" },
    { resource: "DELIVERIES", action: "READ" },
  ],
  clients: [{ resource: "CUSTOMERS", action: "READ" }],
  rapports: [{ resource: "REPORTS", action: "READ" }],
  audit: [{ resource: "AUDIT_LOGS", action: "READ" }],
  users: [{ resource: "USERS", action: "READ" }],
};

export function canSeeTab(permissions: Permission[], tab: NavTab): boolean {
  const required = TAB_PERMISSION[tab];
  if (!required) return true; // dashboard/profile/settings — toujours visibles
  return required.some((r) => can(permissions, r.resource, r.action));
}
