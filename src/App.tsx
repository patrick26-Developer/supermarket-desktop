import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";

import { AppShell } from "@/components/AppShell";
import type { AuthUser } from "@/lib/api";
import { DashboardPage } from "@/pages/DashboardPage";
import { LoginPage } from "@/pages/LoginPage";

export function App() {
  const [user, setUser] = useState<AuthUser | null>(null);

  return (
    <AnimatePresence mode="wait">
      {!user ? (
        <motion.div
          key="login"
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
  );
}
