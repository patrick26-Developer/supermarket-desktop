import {
  Boxes,
  ClipboardList,
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
  Wallet,
  type LucideIcon,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";

import logoUrl from "@/assets/images/logo.png";
import { UserAvatar } from "@/components/UserAvatar";
import type { AuthUser, Permission } from "@/lib/api";
import { useI18n } from "@/lib/i18n";
import { canSeeTab } from "@/lib/permissions";
import type { NavTab } from "@/types/nav";

interface NavItem {
  tab: NavTab;
  icon: LucideIcon;
  labelKey: string;
}

const NAV_ITEMS: NavItem[] = [
  { tab: "dashboard", icon: LayoutDashboard, labelKey: "nav.dashboard" },
  { tab: "caisse", icon: ShoppingCart, labelKey: "nav.caisse" },
  { tab: "catalogue", icon: Boxes, labelKey: "nav.catalogue" },
  { tab: "achats", icon: Truck, labelKey: "nav.achats" },
  { tab: "stock", icon: ClipboardList, labelKey: "nav.stock" },
  { tab: "comptabilite", icon: Wallet, labelKey: "nav.comptabilite" },
  { tab: "clients", icon: Users, labelKey: "nav.clients" },
  { tab: "rapports", icon: FileBarChart, labelKey: "nav.rapports" },
  { tab: "audit", icon: ShieldCheck, labelKey: "nav.audit" },
  { tab: "users", icon: UserCog, labelKey: "nav.users" },
];

interface AppShellProps {
  user: AuthUser;
  permissions: Permission[];
  activeTab: NavTab;
  onNavigate: (tab: NavTab) => void;
  onLogout: () => void;
  children: React.ReactNode;
}

export function AppShell({ user, permissions, activeTab, onNavigate, onLogout, children }: AppShellProps) {
  const { t } = useI18n();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  // Un onglet n'apparaît que si le rôle a le droit de lecture correspondant
  // (voir TAB_PERMISSION, src/lib/permissions.ts) — plutôt que de tout
  // montrer et laisser le backend renvoyer des 403.
  const items = NAV_ITEMS.filter((item) => canSeeTab(permissions, item.tab));

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
          {items.map(({ tab, icon: Icon, labelKey }) => {
            const isActive = activeTab === tab;
            return (
              <button
                key={tab}
                type="button"
                onClick={() => onNavigate(tab)}
                className={`flex w-full items-center gap-3 rounded-md border-l-[3px] px-2.5 py-2 text-sm font-medium transition-colors ${
                  isActive
                    ? "border-primary bg-gradient-to-r from-primary/15 to-transparent text-primary"
                    : "border-transparent hover:bg-secondary hover:text-secondary-foreground"
                }`}
              >
                <Icon className="size-4 shrink-0" />
                <span className="flex-1 text-left">{t(labelKey)}</span>
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
