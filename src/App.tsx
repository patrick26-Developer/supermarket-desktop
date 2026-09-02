import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";

import { AppShell } from "@/components/AppShell";
import { TitleBar } from "@/components/TitleBar";
import type { AuthUser } from "@/lib/api";
import { DashboardPage } from "@/pages/DashboardPage";
import { LoginPage } from "@/pages/LoginPage";

export function App() {
  const [user, setUser] = useState<AuthUser | null>(null);

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
              transition={{ duration: 0.25, ease: "easeOut" }}
            >
              <LoginPage onLoginSuccess={(loggedInUser) => setUser(loggedInUser)} />
            </motion.div>
          ) : (
            <motion.div
              key="app"
              className="h-full"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3, ease: "easeOut", delay: 0.05 }}
            >
              <AppShell user={user} onLogout={() => setUser(null)}>
                <DashboardPage user={user} />
              </AppShell>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
