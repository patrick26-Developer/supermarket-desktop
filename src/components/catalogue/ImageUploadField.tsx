import { LoaderCircle, UploadCloud } from "lucide-react";
import { useRef, useState } from "react";

import { ProductAvatar } from "@/components/catalogue/ProductAvatar";
import { Input } from "@/components/ui/input";
import { api, ApiError } from "@/lib/api";
import { useI18n } from "@/lib/i18n";

interface ImageUploadFieldProps {
  value: string;
  onChange: (url: string) => void;
  name: string;
}

const ACCEPTED_TYPES = "image/jpeg,image/png,image/webp,image/gif";

/**
 * Champ image produit à deux modes : téléversement réel (glisser-déposer ou
 * sélection de fichier, envoyé à POST /uploads/product-image) ou lien externe
 * collé tel quel — les deux écrivent dans le même champ `imageUrl`.
 */
export function ImageUploadField({ value, onChange, name }: ImageUploadFieldProps) {
  const { t } = useI18n();
  const [mode, setMode] = useState<"upload" | "url">("upload");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFile(file: File) {
    setError(null);
    setUploading(true);
    try {
      const { url } = await api.uploads.productImage(file);
      onChange(url);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t("catalogue.uploadError"));
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="flex gap-4">
      <ProductAvatar imageUrl={value || null} name={name} size="lg" />

      <div className="flex-1 space-y-2">
        <div className="inline-flex rounded-md border border-input p-0.5 text-xs font-medium">
          {(["upload", "url"] as const).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setMode(m)}
              className={`rounded px-2.5 py-1 transition-colors ${
                mode === m
                  ? "bg-gradient-to-r from-primary to-accent text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {t(m === "upload" ? "catalogue.uploadTab" : "catalogue.urlTab")}
            </button>
          ))}
        </div>

        {mode === "upload" ? (
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
            className={`flex min-h-16 cursor-pointer items-center justify-center gap-2 rounded-md border-2 border-dashed px-3 py-3 text-center text-xs transition-colors ${
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
                <span className="text-muted-foreground">{t("catalogue.dropHint")}</span>
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
        ) : (
          <Input value={value} onChange={(e) => onChange(e.target.value)} placeholder="https://…" />
        )}

        {error && <p className="text-xs text-destructive">{error}</p>}
      </div>
    </div>
  );
}
