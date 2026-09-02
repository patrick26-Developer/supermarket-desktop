import {
  Boxes,
  FileBarChart,
  LayoutDashboard,
  LogOut,
  ShieldCheck,
  ShoppingCart,
  Truck,
  UserCog,
  Users,
  type LucideIcon,
} from "lucide-react";

import logoUrl from "@/assets/images/logo.png";
import { Button } from "@/components/ui/button";
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

function initials(user: AuthUser) {
  return `${user.firstName[0] ?? ""}${user.lastName[0] ?? ""}`.toUpperCase();
}

interface AppShellProps {
  user: AuthUser;
  activeTab: NavTab;
  onNavigate: (tab: NavTab) => void;
  onLogout: () => void;
  children: React.ReactNode;
}

export function AppShell({ user, activeTab, onNavigate, onLogout, children }: AppShellProps) {
  const { t } = useI18n();
  const canManageUsers = user.roles.includes("SUPER_ADMIN") || user.roles.includes("ADMIN");
  const items = canManageUsers
    ? [...NAV_ITEMS, { tab: "users" as NavTab, icon: UserCog, labelKey: "nav.users", available: true }]
    : NAV_ITEMS;

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
                className={`flex w-full items-center gap-3 rounded-md border-l-2 px-2.5 py-2 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${
                  isActive
                    ? "border-primary bg-primary/10 text-primary"
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

        <div className="border-t border-border p-3">
          <div className="flex items-center gap-3 rounded-md px-2 py-2">
            <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
              {initials(user)}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">
                {user.firstName} {user.lastName}
              </p>
              <p className="truncate text-xs text-muted-foreground">{user.roles.join(", ")}</p>
            </div>
          </div>
          <Button variant="ghost" size="sm" className="mt-1 w-full justify-start" onClick={onLogout}>
            <LogOut />
            {t("nav.logout")}
          </Button>
        </div>
      </aside>

      <main className="min-w-0 flex-1 overflow-y-auto">{children}</main>
    </div>
  );
}
