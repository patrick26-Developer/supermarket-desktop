import { useEffect, useState } from "react";

import { resolveAssetUrl } from "@/lib/api";
import { toneGradientClasses } from "@/lib/category-colors";
import { iconForCategory } from "@/lib/category-icons";

interface ProductAvatarProps {
  imageUrl: string | null;
  name: string;
  /** Nom de la catégorie — choisit l'icône et la teinte du repli. */
  categoryName?: string | null;
  size?: "sm" | "lg";
}

/**
 * Image du produit si disponible (Product.imageUrl — soit un fichier
 * uploadé, chemin relatif résolu via resolveAssetUrl, soit une URL externe
 * collée telle quelle), sinon une icône représentative de la catégorie sur
 * fond dégradé teinté (voir category-icons.ts/category-colors.ts) — pas une
 * icône générique unique pour tout le catalogue.
 */
export function ProductAvatar({ imageUrl, name, categoryName, size = "sm" }: ProductAvatarProps) {
  const [failed, setFailed] = useState(false);
  const dim = size === "lg" ? "size-16" : "size-10";
  const iconDim = size === "lg" ? "size-7" : "size-4.5";
  const resolved = resolveAssetUrl(imageUrl);

  // Réautorise une nouvelle tentative de chargement quand la source change
  // (ex. image tout juste uploadée après un échec précédent).
  useEffect(() => setFailed(false), [resolved]);

  if (resolved && !failed) {
    return (
      <img
        src={resolved}
        alt={name}
        onError={() => setFailed(true)}
        className={`${dim} shrink-0 rounded-md border border-border object-cover`}
      />
    );
  }

  const Icon = iconForCategory(categoryName);

  return (
    <div
      className={`flex ${dim} shrink-0 items-center justify-center rounded-md text-white ${toneGradientClasses(categoryName ?? name)}`}
    >
      <Icon className={iconDim} />
    </div>
  );
}
