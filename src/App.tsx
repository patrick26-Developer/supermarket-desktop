import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";

import { AppShell } from "@/components/AppShell";
import { TitleBar } from "@/components/TitleBar";
import type { AuthUser } from "@/lib/api";
import { setAccessToken } from "@/lib/auth-store";
import { AuditPage } from "@/pages/AuditPage";
import { CashierPage } from "@/pages/CashierPage";
import { CataloguePage } from "@/pages/CataloguePage";
import { ClientsPage } from "@/pages/ClientsPage";
import { DashboardPage } from "@/pages/DashboardPage";
import { LoginPage } from "@/pages/LoginPage";
import { PurchasingPage } from "@/pages/PurchasingPage";
import { ReportsPage } from "@/pages/ReportsPage";
import { UsersPage } from "@/pages/UsersPage";
import type { NavTab } from "@/types/nav";

const TAB_PAGES: Record<Exclude<NavTab, "dashboard">, React.ComponentType> = {
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
  const [activeTab, setActiveTab] = useState<NavTab>("dashboard");

  function handleLoginSuccess(loggedInUser: AuthUser, accessToken: string) {
    setAccessToken(accessToken);
    setUser(loggedInUser);
  }

  function handleLogout() {
    setAccessToken(null);
    setUser(null);
    setActiveTab("dashboard");
  }

  const TabPage = activeTab === "dashboard" ? null : TAB_PAGES[activeTab];

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
              <AppShell user={user} activeTab={activeTab} onNavigate={setActiveTab} onLogout={handleLogout}>
                {TabPage ? <TabPage /> : <DashboardPage user={user} onNavigate={setActiveTab} />}
              </AppShell>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
