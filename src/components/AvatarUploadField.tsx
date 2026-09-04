import { LoaderCircle, UploadCloud } from "lucide-react";
import { useRef, useState } from "react";

import { UserAvatar } from "@/components/UserAvatar";
import { api, ApiError } from "@/lib/api";
import { useI18n } from "@/lib/i18n";

interface AvatarUploadFieldProps {
  avatarUrl: string | null;
  firstName: string;
  lastName: string;
  onChange: (url: string) => void;
}

const ACCEPTED_TYPES = "image/jpeg,image/png,image/webp,image/gif";

/** Glisser-déposer/sélection pour la photo de profil, upload direct (POST /uploads/avatar). */
export function AvatarUploadField({ avatarUrl, firstName, lastName, onChange }: AvatarUploadFieldProps) {
  const { t } = useI18n();
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFile(file: File) {
    setError(null);
    setUploading(true);
    try {
      const { url } = await api.uploads.avatar(file);
      onChange(url);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t("catalogue.uploadError"));
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="flex items-center gap-4">
      <UserAvatar avatarUrl={avatarUrl} firstName={firstName} lastName={lastName} size="lg" />
      <div>
        <div
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragOver(false);
            const file = e.dataTransfer.files?.[0];
            if (file) void handleFile(file);
          }}
          className={`flex cursor-pointer items-center gap-2 rounded-md border-2 border-dashed px-3 py-2 text-xs transition-colors ${
            dragOver ? "border-primary bg-primary/5" : "border-input hover:border-primary/40 hover:bg-secondary/40"
          }`}
        >
          {uploading ? (
            <>
              <LoaderCircle className="size-3.5 animate-spin text-primary" />
              {t("catalogue.uploading")}
            </>
          ) : (
            <>
              <UploadCloud className="size-3.5 text-muted-foreground" />
              <span className="text-muted-foreground">{t("profile.changePhoto")}</span>
            </>
          )}
          <input
            ref={inputRef}
            type="file"
            accept={ACCEPTED_TYPES}
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              e.target.value = "";
              if (file) void handleFile(file);
            }}
          />
        </div>
        {error && <p className="mt-1.5 text-xs text-destructive">{error}</p>}
      </div>
    </div>
  );
}
