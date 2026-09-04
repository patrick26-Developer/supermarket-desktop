import {
  Beef,
  BookOpen,
  CupSoda,
  Fish,
  Headphones,
  Package,
  ShoppingBasket,
  Snowflake,
  Sparkles,
  Wheat,
  type LucideIcon,
} from "lucide-react";

/**
 * Icône représentative par catégorie — aucune photo produit réelle
 * disponible pour la plupart des articles, donc plutôt qu'une icône
 * générique unique pour tout le catalogue, chaque catégorie a sa propre
 * silhouette + sa couleur (voir category-colors.ts). Reconnaissable au
 * clin d'œil, honnête (aucune photo inventée), scalable à N produits.
 * Correspondance approximative sur le nom de catégorie (insensible à la
 * casse/accents) plutôt qu'un id — les catégories sont créées à la main,
 * pas d'enum stable côté backend.
 */
const ICON_BY_KEYWORD: { test: RegExp; icon: LucideIcon }[] = [
  { test: /boisson/i, icon: CupSoda },
  { test: /boucherie|viande|boeuf|poulet/i, icon: Beef },
  { test: /poisson/i, icon: Fish },
  { test: /surgel/i, icon: Snowflake },
  { test: /boulanger|pain/i, icon: Wheat },
  { test: /hygi[eè]ne|beaut[eé]/i, icon: Sparkles },
  { test: /papeterie|librairie|livre/i, icon: BookOpen },
  { test: /[ée]lectronique/i, icon: Headphones },
  { test: /[ée]picerie/i, icon: ShoppingBasket },
];

export function iconForCategory(categoryName: string | null | undefined): LucideIcon {
  if (!categoryName) return Package;
  const match = ICON_BY_KEYWORD.find((entry) => entry.test.test(categoryName));
  return match?.icon ?? Package;
}
