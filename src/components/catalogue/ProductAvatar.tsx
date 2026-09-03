import { Package } from "lucide-react";
import { useEffect, useState } from "react";

import { resolveAssetUrl } from "@/lib/api";

interface ProductAvatarProps {
  imageUrl: string | null;
  name: string;
  size?: "sm" | "lg";
}

/**
 * Image du produit si disponible (Product.imageUrl — soit un fichier
 * uploadé, chemin relatif résolu via resolveAssetUrl, soit une URL externe
 * collée telle quelle), sinon une icône générique dans une tuile colorée.
 */
export function ProductAvatar({ imageUrl, name, size = "sm" }: ProductAvatarProps) {
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

  return (
    <div
      className={`flex ${dim} shrink-0 items-center justify-center rounded-md bg-gradient-to-br from-secondary to-secondary/60 text-secondary-foreground`}
    >
      <Package className={iconDim} />
    </div>
  );
}
