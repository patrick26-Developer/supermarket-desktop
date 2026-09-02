import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";

import { AppShell } from "@/components/AppShell";
import { TitleBar } from "@/components/TitleBar";
import { setAccessToken } from "@/lib/auth-store";
import type { AuthUser } from "@/lib/api";
import { CashierPage } from "@/pages/CashierPage";
import { DashboardPage } from "@/pages/DashboardPage";
import { LoginPage } from "@/pages/LoginPage";
import type { NavTab } from "@/types/nav";

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
                {activeTab === "caisse" ? <CashierPage /> : <DashboardPage user={user} />}
              </AppShell>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
