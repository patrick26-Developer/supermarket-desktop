import {
  Boxes,
  FileBarChart,
  LayoutDashboard,
  LogOut,
  Settings,
  ShieldCheck,
  ShoppingCart,
  Truck,
  UserCircle,
  UserCog,
  Users,
  type LucideIcon,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";

import logoUrl from "@/assets/images/logo.png";
import { UserAvatar } from "@/components/UserAvatar";
import type { AuthUser } from "@/lib/api";
import { useI18n } from "@/lib/i18n";
import type { NavTab } from "@/types/nav";

interface NavItem {
  tab: NavTab;
  icon: LucideIcon;
  labelKey: string;
  available: boolean;
}

const NAV_ITEMS: NavItem[] = [
  { tab: "dashboard", icon: LayoutDashboard, labelKey: "nav.dashboard", available: true },
  { tab: "caisse", icon: ShoppingCart, labelKey: "nav.caisse", available: true },
  { tab: "catalogue", icon: Boxes, labelKey: "nav.catalogue", available: true },
  { tab: "achats", icon: Truck, labelKey: "nav.achats", available: true },
  { tab: "clients", icon: Users, labelKey: "nav.clients", available: true },
  { tab: "rapports", icon: FileBarChart, labelKey: "nav.rapports", available: true },
  { tab: "audit", icon: ShieldCheck, labelKey: "nav.audit", available: true },
];

interface AppShellProps {
  user: AuthUser;
  activeTab: NavTab;
  onNavigate: (tab: NavTab) => void;
  onLogout: () => void;
  children: React.ReactNode;
}

export function AppShell({ user, activeTab, onNavigate, onLogout, children }: AppShellProps) {
  const { t } = useI18n();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const canManageUsers = user.roles.includes("SUPER_ADMIN") || user.roles.includes("ADMIN");
  const items = canManageUsers
    ? [...NAV_ITEMS, { tab: "users" as NavTab, icon: UserCog, labelKey: "nav.users", available: true }]
    : NAV_ITEMS;

  useEffect(() => {
    if (!menuOpen) return;
    function onClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, [menuOpen]);

  return (
    <div className="flex h-full bg-background">
      <aside className="flex w-64 shrink-0 flex-col border-r border-border bg-card">
        <div className="flex items-center gap-2.5 px-6 py-5">
          <img src={logoUrl} alt="" className="size-8" />
          <span className="text-base font-semibold tracking-tight">{t("appName")}</span>
        </div>

        <nav className="flex-1 space-y-0.5 px-3 py-2">
          {items.map(({ tab, icon: Icon, labelKey, available }) => {
            const isActive = available && activeTab === tab;
            return (
              <button
                key={tab}
                type="button"
                disabled={!available}
                onClick={() => available && onNavigate(tab)}
                className={`flex w-full items-center gap-3 rounded-md border-l-[3px] px-2.5 py-2 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${
                  isActive
                    ? "border-primary bg-gradient-to-r from-primary/15 to-transparent text-primary"
                    : "border-transparent enabled:hover:bg-secondary enabled:hover:text-secondary-foreground"
                }`}
              >
                <Icon className="size-4 shrink-0" />
                <span className="flex-1 text-left">{t(labelKey)}</span>
                {!available && (
                  <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold tracking-wide text-muted-foreground uppercase">
                    {t("nav.soon")}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        <div ref={menuRef} className="relative border-t border-border p-3">
          {menuOpen && (
            <div className="absolute inset-x-3 bottom-full z-10 mb-1 overflow-hidden rounded-lg border-2 border-border bg-popover">
              <button
                type="button"
                onClick={() => {
                  onNavigate("profile");
                  setMenuOpen(false);
                }}
                className="flex w-full items-center gap-2.5 px-3 py-2.5 text-left text-sm text-popover-foreground transition-colors hover:bg-secondary"
              >
                <UserCircle className="size-4 text-muted-foreground" />
                {t("nav.profile")}
              </button>
              <button
                type="button"
                onClick={() => {
                  onNavigate("settings");
                  setMenuOpen(false);
                }}
                className="flex w-full items-center gap-2.5 px-3 py-2.5 text-left text-sm text-popover-foreground transition-colors hover:bg-secondary"
              >
                <Settings className="size-4 text-muted-foreground" />
                {t("nav.settings")}
              </button>
              <div className="border-t border-border" />
              <button
                type="button"
                onClick={onLogout}
                className="flex w-full items-center gap-2.5 px-3 py-2.5 text-left text-sm text-destructive transition-colors hover:bg-destructive/10"
              >
                <LogOut className="size-4" />
                {t("nav.logout")}
              </button>
            </div>
          )}
          <button
            type="button"
            onClick={() => setMenuOpen((v) => !v)}
            className="flex w-full items-center gap-3 rounded-md px-2 py-2 text-left transition-colors hover:bg-secondary"
          >
            <UserAvatar avatarUrl={user.avatarUrl} firstName={user.firstName} lastName={user.lastName} />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">
                {user.firstName} {user.lastName}
              </p>
              <p className="truncate text-xs text-muted-foreground">{user.roles.join(", ")}</p>
            </div>
          </button>
        </div>
      </aside>

      <main className="min-w-0 flex-1 overflow-y-auto">{children}</main>
    </div>
  );
}
