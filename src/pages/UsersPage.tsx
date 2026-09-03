import { CheckCircle2, Copy, KeyRound, LoaderCircle, Pencil, Plus, UserCog, X } from "lucide-react";
import { useEffect, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { api, ApiError, type AppUser, type AppUserDetail, type Role } from "@/lib/api";
import { useI18n } from "@/lib/i18n";

function generatePassword() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$";
  let out = "";
  for (let i = 0; i < 12; i++) out += chars[Math.floor(Math.random() * chars.length)];
  return out;
}

export function UsersPage() {
  const { t } = useI18n();
  const [users, setUsers] = useState<AppUser[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [resetTarget, setResetTarget] = useState<AppUser | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [createdCreds, setCreatedCreds] = useState<{ email: string; password: string } | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const [userList, roleList] = await Promise.all([api.users.list(), api.roles.list()]);
      setUsers(userList);
      setRoles(roleList);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Impossible de contacter le serveur");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const filtered = users.filter((u) => {
    const haystack = `${u.firstName} ${u.lastName} ${u.email} ${u.phone ?? ""}`.toLowerCase();
    return haystack.includes(query.toLowerCase());
  });

  return (
    <div className="mx-auto max-w-4xl px-10 py-10">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-primary">{t("users.eyebrow")}</p>
          <h1 className="mt-1 text-2xl font-semibold text-foreground">{t("users.title")}</h1>
        </div>
        <Button onClick={() => setShowForm((v) => !v)}>
          {showForm ? <X /> : <Plus />}
          {showForm ? t("common.cancel") : t("users.newUser")}
        </Button>
      </div>

      {showForm && (
        <NewUserForm
          roles={roles}
          onCreated={(creds) => {
            setShowForm(false);
            setCreatedCreds(creds);
            load();
          }}
        />
      )}

      {createdCreds && (
        <div className="mt-4 flex items-start gap-3 rounded-lg border border-primary/30 bg-primary/5 p-4">
          <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-primary" />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-foreground">{t("users.createdCredentials")}</p>
            <div className="mt-2 flex items-center gap-2 font-mono text-xs">
              <span className="rounded bg-muted px-2 py-1">{createdCreds.email}</span>
              <span className="rounded bg-muted px-2 py-1">{createdCreds.password}</span>
              <button
                type="button"
                onClick={() => navigator.clipboard.writeText(`${createdCreds.email} / ${createdCreds.password}`)}
                className="text-muted-foreground hover:text-foreground"
                aria-label="Copier"
              >
                <Copy className="size-3.5" />
              </button>
            </div>
          </div>
          <button type="button" onClick={() => setCreatedCreds(null)} className="text-muted-foreground hover:text-foreground">
            <X className="size-4" />
          </button>
        </div>
      )}

      <Input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={t("users.searchPlaceholder")}
        className="mt-6 max-w-sm"
      />

      {error && <p className="mt-4 text-sm text-destructive">{error}</p>}

      <div className="mt-4 overflow-hidden rounded-lg border border-border bg-card">
        {loading ? (
          <div className="flex items-center justify-center py-16 text-muted-foreground">
            <LoaderCircle className="size-5 animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-16 text-center text-muted-foreground">
            <UserCog className="size-8" />
            <p className="text-sm">{t("users.noUsers")}</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs text-muted-foreground uppercase">
                <th className="px-4 py-3 font-medium">{t("users.colName")}</th>
                <th className="px-4 py-3 font-medium">{t("users.colEmail")}</th>
                <th className="px-4 py-3 font-medium">{t("users.colStatus")}</th>
                <th className="px-4 py-3 font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((u) => (
                <tr
                  key={u.id}
                  onClick={() => setEditingId(u.id)}
                  className="cursor-pointer border-b border-border last:border-0 hover:bg-secondary/50"
                >
                  <td className="px-4 py-3 font-medium text-foreground">
                    {u.firstName} {u.lastName}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{u.email}</td>
                  <td className="px-4 py-3">
                    <Badge tone={u.status === "ACTIVE" ? "success" : "neutral"}>{u.status}</Badge>
                  </td>
                  <td className="px-4 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                    <div className="flex justify-end gap-1.5">
                      <Button variant="outline" size="sm" onClick={() => setEditingId(u.id)}>
                        <Pencil className="size-3.5" />
                        {t("common.details")}
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => setResetTarget(u)}>
                        <KeyRound className="size-3.5" />
                        {t("users.resetPassword")}
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {resetTarget && <ResetPasswordDialog user={resetTarget} onClose={() => setResetTarget(null)} />}
      {editingId && (
        <UserDetailsDialog
          id={editingId}
          roles={roles}
          onClose={() => setEditingId(null)}
          onChanged={load}
        />
      )}
    </div>
  );
}

function UserDetailsDialog({
  id,
  roles,
  onClose,
  onChanged,
}: {
  id: string;
  roles: Role[];
  onClose: () => void;
  onChanged: () => void;
}) {
  const { t } = useI18n();
  const [user, setUser] = useState<AppUserDetail | null>(null);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [status, setStatus] = useState("ACTIVE");
  const [submitting, setSubmitting] = useState(false);
  const [busyRole, setBusyRole] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    try {
      const u = await api.users.findOne(id);
      setUser(u);
      setFirstName(u.firstName);
      setLastName(u.lastName);
      setPhone(u.phone ?? "");
      setStatus(u.status);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Impossible de charger l'utilisateur");
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await api.users.update(id, { firstName, lastName, phone: phone || undefined, status });
      onChanged();
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Action impossible");
    } finally {
      setSubmitting(false);
    }
  }

  const activeRoles = new Set((user?.roles ?? []).map((r) => r.role.code));

  async function toggleRole(code: string) {
    setBusyRole(code);
    setError(null);
    try {
      if (activeRoles.has(code)) await api.users.revokeRole(id, code);
      else await api.users.assignRole(id, code);
      await load();
      onChanged();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Action impossible");
    } finally {
      setBusyRole(null);
    }
  }

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{user ? `${user.firstName} ${user.lastName}` : "…"}</DialogTitle>
          {user && <DialogDescription>{user.email}</DialogDescription>}
        </DialogHeader>

        {!user ? (
          <div className="flex justify-center py-8">
            <LoaderCircle className="size-5 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <>
            <form onSubmit={handleSubmit} className="mt-3 grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>{t("users.firstName")}</Label>
                <Input value={firstName} onChange={(e) => setFirstName(e.target.value)} required />
              </div>
              <div className="space-y-1.5">
                <Label>{t("users.lastName")}</Label>
                <Input value={lastName} onChange={(e) => setLastName(e.target.value)} required />
              </div>
              <div className="space-y-1.5">
                <Label>{t("purchasing.phone")}</Label>
                <Input value={phone} onChange={(e) => setPhone(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>{t("common.status")}</Label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
                >
                  <option value="ACTIVE">ACTIVE</option>
                  <option value="INVITED">INVITED</option>
                  <option value="SUSPENDED">SUSPENDED</option>
                  <option value="BLOCKED">BLOCKED</option>
                  <option value="INACTIVE">INACTIVE</option>
                  <option value="ARCHIVED">ARCHIVED</option>
                </select>
              </div>
              <div className="col-span-2 flex items-center gap-2">
                {error && <p className="mr-auto text-sm text-destructive">{error}</p>}
                <Button type="submit" size="sm" disabled={submitting}>
                  {submitting && <LoaderCircle className="animate-spin" />}
                  {t("common.save")}
                </Button>
              </div>
            </form>

            <div className="mt-4 border-t border-border pt-4">
              <Label>{t("users.manageRoles")}</Label>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {roles.map((r) => {
                  const active = activeRoles.has(r.code);
                  return (
                    <button
                      key={r.code}
                      type="button"
                      disabled={busyRole === r.code}
                      onClick={() => toggleRole(r.code)}
                      className={`rounded-full px-3 py-1 text-xs font-medium transition-colors disabled:opacity-50 ${
                        active
                          ? "bg-primary text-primary-foreground"
                          : "bg-secondary text-secondary-foreground hover:bg-secondary/70"
                      }`}
                    >
                      {r.name}
                    </button>
                  );
                })}
              </div>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

function NewUserForm({
  roles,
  onCreated,
}: {
  roles: Role[];
  onCreated: (creds: { email: string; password: string }) => void;
}) {
  const { t } = useI18n();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState(generatePassword());
  const [selectedRoles, setSelectedRoles] = useState<string[]>(["CASHIER"]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function toggleRole(code: string) {
    setSelectedRoles((prev) => (prev.includes(code) ? prev.filter((r) => r !== code) : [...prev, code]));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await api.users.create({ firstName, lastName, email, password, roles: selectedRoles });
      onCreated({ email, password });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Création impossible");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mt-4 rounded-lg border border-border bg-card p-5">
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label>{t("users.firstName")}</Label>
          <Input value={firstName} onChange={(e) => setFirstName(e.target.value)} required />
        </div>
        <div className="space-y-1.5">
          <Label>{t("users.lastName")}</Label>
          <Input value={lastName} onChange={(e) => setLastName(e.target.value)} required />
        </div>
        <div className="space-y-1.5">
          <Label>{t("users.email")}</Label>
          <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </div>
        <div className="space-y-1.5">
          <Label>{t("users.password")}</Label>
          <div className="flex gap-1.5">
            <Input value={password} onChange={(e) => setPassword(e.target.value)} required className="font-mono" />
            <Button type="button" variant="outline" size="sm" onClick={() => setPassword(generatePassword())}>
              {t("users.generatePassword")}
            </Button>
          </div>
        </div>
      </div>

      <div className="mt-3 space-y-1.5">
        <Label>{t("users.roles")}</Label>
        <div className="flex flex-wrap gap-1.5">
          {roles.map((r) => (
            <button
              key={r.code}
              type="button"
              onClick={() => toggleRole(r.code)}
              className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                selectedRoles.includes(r.code)
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-secondary-foreground hover:bg-secondary/70"
              }`}
            >
              {r.name}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-4 flex items-center gap-2">
        {error && <p className="mr-auto text-sm text-destructive">{error}</p>}
        <Button type="submit" size="sm" disabled={submitting}>
          {submitting && <LoaderCircle className="animate-spin" />}
          {t("common.create")}
        </Button>
      </div>
    </form>
  );
}

function ResetPasswordDialog({ user, onClose }: { user: AppUser; onClose: () => void }) {
  const { t } = useI18n();
  const [password, setPassword] = useState(generatePassword());
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await api.users.resetPassword(user.id, password);
      setDone(true);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Action impossible");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {t("users.resetPassword")} — {user.firstName} {user.lastName}
          </DialogTitle>
          <DialogDescription>{user.email}</DialogDescription>
        </DialogHeader>
        {done ? (
          <div className="mt-4 flex items-center gap-3 rounded-lg border border-primary/30 bg-primary/5 p-4">
            <CheckCircle2 className="size-4 shrink-0 text-primary" />
            <span className="font-mono text-sm">{password}</span>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-4 space-y-3">
            <div className="space-y-1.5">
              <Label>{t("users.newPassword")}</Label>
              <div className="flex gap-1.5">
                <Input value={password} onChange={(e) => setPassword(e.target.value)} className="font-mono" required />
                <Button type="button" variant="outline" size="sm" onClick={() => setPassword(generatePassword())}>
                  {t("users.generatePassword")}
                </Button>
              </div>
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <DialogFooter>
              <Button type="submit" disabled={submitting}>
                {submitting && <LoaderCircle className="animate-spin" />}
                {t("common.save")}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
