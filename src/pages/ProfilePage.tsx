import { CheckCircle2, LoaderCircle } from "lucide-react";
import { useState } from "react";

import { AvatarUploadField } from "@/components/AvatarUploadField";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { api, ApiError, type AuthUser } from "@/lib/api";
import { useI18n } from "@/lib/i18n";

interface ProfilePageProps {
  user: AuthUser;
  onUserUpdate: (user: AuthUser) => void;
}

export function ProfilePage({ user, onUserUpdate }: ProfilePageProps) {
  const { t } = useI18n();

  return (
    <div className="mx-auto max-w-2xl px-10 py-10">
      <p className="text-sm font-medium text-primary">{t("profile.eyebrow")}</p>
      <h1 className="mt-1 text-2xl font-semibold text-foreground">{t("profile.title")}</h1>

      <div className="mt-8 space-y-6">
        <ProfileInfoCard user={user} onUserUpdate={onUserUpdate} />
        <SecurityCard />
      </div>
    </div>
  );
}

function ProfileInfoCard({ user, onUserUpdate }: ProfilePageProps) {
  const { t } = useI18n();
  const [firstName, setFirstName] = useState(user.firstName);
  const [lastName, setLastName] = useState(user.lastName);
  const [phone, setPhone] = useState("");
  const [avatarUrl, setAvatarUrl] = useState(user.avatarUrl ?? null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    setSaved(false);
    try {
      await api.auth.updateProfile({
        firstName,
        lastName,
        phone: phone || undefined,
        avatarUrl: avatarUrl || undefined,
      });
      onUserUpdate({ ...user, firstName, lastName, avatarUrl });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Action impossible");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("profile.personalInfo")}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-5">
          <AvatarUploadField
            avatarUrl={avatarUrl}
            firstName={firstName}
            lastName={lastName}
            onChange={setAvatarUrl}
          />

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>{t("profile.firstName")}</Label>
              <Input value={firstName} onChange={(e) => setFirstName(e.target.value)} required />
            </div>
            <div className="space-y-1.5">
              <Label>{t("profile.lastName")}</Label>
              <Input value={lastName} onChange={(e) => setLastName(e.target.value)} required />
            </div>
            <div className="col-span-2 space-y-1.5">
              <Label>{t("profile.email")}</Label>
              <Input value={user.email} disabled />
              <p className="text-xs text-muted-foreground">{t("profile.emailHint")}</p>
            </div>
            <div className="col-span-2 space-y-1.5">
              <Label>{t("profile.phone")}</Label>
              <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+242…" />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Button type="submit" disabled={submitting}>
              {submitting && <LoaderCircle className="animate-spin" />}
              {t("profile.saveProfile")}
            </Button>
            {saved && (
              <span className="flex items-center gap-1.5 text-sm text-emerald-600">
                <CheckCircle2 className="size-4" />
                {t("profile.profileSaved")}
              </span>
            )}
            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

function SecurityCard() {
  const { t } = useI18n();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaved(false);
    if (newPassword !== confirmPassword) {
      setError(t("profile.passwordMismatch"));
      return;
    }
    setSubmitting(true);
    try {
      await api.auth.changePassword(currentPassword, newPassword);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Action impossible");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("profile.security")}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label>{t("profile.currentPassword")}</Label>
            <Input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>{t("profile.newPassword")}</Label>
              <Input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                minLength={8}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label>{t("profile.confirmPassword")}</Label>
              <Input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                minLength={8}
                required
              />
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button type="submit" variant="outline" disabled={submitting}>
              {submitting && <LoaderCircle className="animate-spin" />}
              {t("profile.changePassword")}
            </Button>
            {saved && (
              <span className="flex items-center gap-1.5 text-sm text-emerald-600">
                <CheckCircle2 className="size-4" />
                {t("profile.passwordChanged")}
              </span>
            )}
            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
