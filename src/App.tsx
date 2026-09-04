import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";

import { AppShell } from "@/components/AppShell";
import { TitleBar } from "@/components/TitleBar";
import { api, type AuthUser, type Permission } from "@/lib/api";
import { setAccessToken } from "@/lib/auth-store";
import { AuditPage } from "@/pages/AuditPage";
import { CashierPage } from "@/pages/CashierPage";
import { CataloguePage } from "@/pages/CataloguePage";
import { ClientsPage } from "@/pages/ClientsPage";
import { DashboardPage } from "@/pages/DashboardPage";
import { LoginPage } from "@/pages/LoginPage";
import { ProfilePage } from "@/pages/ProfilePage";
import { PurchasingPage } from "@/pages/PurchasingPage";
import { ReportsPage } from "@/pages/ReportsPage";
import { SettingsPage } from "@/pages/SettingsPage";
import { UsersPage } from "@/pages/UsersPage";
import type { NavTab } from "@/types/nav";

const TAB_PAGES: Record<
  Exclude<NavTab, "dashboard" | "profile" | "settings">,
  React.ComponentType<{ permissions: Permission[] }>
> = {
  caisse: CashierPage,
  catalogue: CataloguePage,
  achats: PurchasingPage,
  clients: ClientsPage,
  rapports: ReportsPage,
  audit: AuditPage,
  users: UsersPage,
};

export function App() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [activeTab, setActiveTab] = useState<NavTab>("dashboard");

  async function handleLoginSuccess(loggedInUser: AuthUser, accessToken: string) {
    setAccessToken(accessToken);
    setUser(loggedInUser);
    // Permissions effectives du rôle — pilotent l'affichage des onglets/actions
    // (voir src/lib/permissions.ts). Chargées une fois à la connexion : elles
    // ne changent pas en cours de session (un changement de rôle nécessite de
    // toute façon de se reconnecter pour obtenir un nouveau token).
    try {
      setPermissions(await api.auth.permissions());
    } catch {
      setPermissions([]);
    }
  }

  function handleLogout() {
    setAccessToken(null);
    setUser(null);
    setPermissions([]);
    setActiveTab("dashboard");
  }

  function renderTab() {
    if (!user) return null;
    if (activeTab === "dashboard") return <DashboardPage user={user} permissions={permissions} onNavigate={setActiveTab} />;
    if (activeTab === "profile") return <ProfilePage user={user} onUserUpdate={setUser} />;
    if (activeTab === "settings") return <SettingsPage user={user} />;
    const TabPage = TAB_PAGES[activeTab];
    return <TabPage permissions={permissions} />;
  }

  return (
    <div className="flex h-screen flex-col overflow-hidden">
      <TitleBar />
      <div className="min-h-0 flex-1">
        <AnimatePresence mode="wait">
          {!user ? (
            <motion.div
              key="login"
              className="h-full"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
            >
              <LoginPage onLoginSuccess={handleLoginSuccess} />
            </motion.div>
          ) : (
            <motion.div
              key="app"
              className="h-full"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
            >
              <AppShell
                user={user}
                permissions={permissions}
                activeTab={activeTab}
                onNavigate={setActiveTab}
                onLogout={handleLogout}
              >
                {renderTab()}
              </AppShell>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
