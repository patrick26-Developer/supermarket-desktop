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
 * Permission de lecture qui conditionne l'affichage de chaque onglet —
 * `dashboard`/`profile`/`settings` en sont absents, toujours visibles.
 * Reflète ROLE_GRANTS côté backend (src/prisma/seed.ts) : un onglet
 * n'apparaît que si le rôle a au moins un droit de lecture sur son
 * entité principale.
 */
export const TAB_PERMISSION: Partial<Record<NavTab, { resource: string; action: string }>> = {
  caisse: { resource: "SALES", action: "READ" },
  catalogue: { resource: "PRODUCTS", action: "READ" },
  achats: { resource: "SUPPLIERS", action: "READ" },
  clients: { resource: "CUSTOMERS", action: "READ" },
  rapports: { resource: "REPORTS", action: "READ" },
  audit: { resource: "AUDIT_LOGS", action: "READ" },
  users: { resource: "USERS", action: "READ" },
};

export function canSeeTab(permissions: Permission[], tab: NavTab): boolean {
  const required = TAB_PERMISSION[tab];
  if (!required) return true; // dashboard/profile/settings — toujours visibles
  return can(permissions, required.resource, required.action);
}
