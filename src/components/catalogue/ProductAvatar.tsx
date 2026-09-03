import { Package } from "lucide-react";
import { useState } from "react";

interface ProductAvatarProps {
  imageUrl: string | null;
  name: string;
  size?: "sm" | "lg";
}

/**
 * Image du produit si disponible (Product.imageUrl, backend), sinon une
 * icône générique dans une tuile colorée — aucun produit n'a encore de
 * vraie photo (pas d'upload de fichier côté backend, juste une URL), donc
 * ce repli n'est pas une exception mais l'état par défaut attendu pour
 * l'instant.
 */
export function ProductAvatar({ imageUrl, name, size = "sm" }: ProductAvatarProps) {
  const [failed, setFailed] = useState(false);
  const dim = size === "lg" ? "size-16" : "size-10";
  const iconDim = size === "lg" ? "size-7" : "size-4.5";

  if (imageUrl && !failed) {
    return (
      <img
        src={imageUrl}
        alt={name}
        onError={() => setFailed(true)}
        className={`${dim} shrink-0 rounded-md border border-border object-cover`}
      />
    );
  }

  return (
    <div className={`flex ${dim} shrink-0 items-center justify-center rounded-md bg-secondary text-secondary-foreground`}>
      <Package className={iconDim} />
    </div>
  );
}
