import { useEffect, useState } from "react";

import { resolveAssetUrl } from "@/lib/api";

interface UserAvatarProps {
  avatarUrl?: string | null;
  firstName: string;
  lastName: string;
  size?: "sm" | "md" | "lg";
}

const SIZE_CLASSES: Record<NonNullable<UserAvatarProps["size"]>, string> = {
  sm: "size-8 text-xs",
  md: "size-12 text-sm",
  lg: "size-20 text-xl",
};

/** Photo de profil si disponible, sinon initiales sur fond dégradé bleu → or. */
export function UserAvatar({ avatarUrl, firstName, lastName, size = "sm" }: UserAvatarProps) {
  const [failed, setFailed] = useState(false);
  const resolved = resolveAssetUrl(avatarUrl);
  useEffect(() => setFailed(false), [resolved]);

  if (resolved && !failed) {
    return (
      <img
        src={resolved}
        alt=""
        onError={() => setFailed(true)}
        className={`${SIZE_CLASSES[size]} shrink-0 rounded-full border border-border object-cover`}
      />
    );
  }

  return (
    <div
      className={`flex ${SIZE_CLASSES[size]} shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary to-accent font-semibold text-primary-foreground`}
    >
      {`${firstName[0] ?? ""}${lastName[0] ?? ""}`.toUpperCase()}
    </div>
  );
}
