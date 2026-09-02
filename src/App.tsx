import { LogOut, Store } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import type { AuthUser } from "@/lib/api";
import { LoginPage } from "@/pages/LoginPage";

export function App() {
  const [user, setUser] = useState<AuthUser | null>(null);

  if (!user) {
    return <LoginPage onLoginSuccess={(loggedInUser) => setUser(loggedInUser)} />;
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="flex items-center justify-between border-b px-6 py-4">
        <div className="flex items-center gap-2 font-semibold text-primary">
          <Store className="size-5" />
          Superette
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm text-muted-foreground">
            {user.firstName} {user.lastName} · {user.roles.join(", ")}
          </span>
          <Button variant="outline" size="sm" onClick={() => setUser(null)}>
            <LogOut />
            Déconnexion
          </Button>
        </div>
      </header>
      <main className="p-6">
        <p className="text-muted-foreground">
          Connexion à l'API réussie. Prochaine étape : construire les écrans métier (caisse,
          catalogue, stock…).
        </p>
      </main>
    </div>
  );
}
