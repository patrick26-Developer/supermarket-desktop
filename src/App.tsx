import { useState } from "react";

import { AppShell } from "@/components/AppShell";
import type { AuthUser } from "@/lib/api";
import { DashboardPage } from "@/pages/DashboardPage";
import { LoginPage } from "@/pages/LoginPage";

export function App() {
  const [user, setUser] = useState<AuthUser | null>(null);

  if (!user) {
    return <LoginPage onLoginSuccess={(loggedInUser) => setUser(loggedInUser)} />;
  }

  return (
    <AppShell user={user} onLogout={() => setUser(null)}>
      <DashboardPage user={user} />
    </AppShell>
  );
}
