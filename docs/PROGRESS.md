# Journal d'avancement — Supermarket Desktop

> Voir [ARCHITECTURE.md](./ARCHITECTURE.md) pour le contexte technique.

## 2026-09-02 — Design system premium (typographie, palette, layout)

Refonte visuelle complète, à la demande explicite d'un rendu "premium" plutôt que le style shadcn par défaut (gris neutre, police système). Choix délibérément appliqués **sans dépendre d'une skill de design externe** (voir discussion avec l'utilisateur — les skills communautaires non vérifiées comportent un risque réel d'injection de prompt).

**Typographie** — paire distinctive au lieu d'Inter/Arial : [`Fraunces Variable`](https://fonts.google.com/specimen/Fraunces) (serif éditorial, titres) + [`Manrope Variable`](https://fonts.google.com/specimen/Manrope) (sans-serif géométrique, texte courant), auto-hébergées via `@fontsource-variable/*` (npm, fichiers woff2 locaux) — **pas de dépendance CDN Google Fonts à l'exécution**, cohérent avec un poste de caisse qui doit pouvoir tourner sans accès internet garanti.

**Palette** — jetons OKLCH "épicerie fine" (`src/index.css`) : vert forêt profond en primaire (fraîcheur/confiance), terracotta chaud en accent, fond ivoire plutôt que blanc/gris pur — volontairement à l'écart du gris neutre + dégradé violet générique. Variantes light/dark définies.

**Écran de connexion** (`src/pages/LoginPage.tsx`) — passage d'une carte centrée sur fond gris à une mise en page **plein écran en deux panneaux** : panneau de marque (fond vert forêt, halos organiques en dégradé radial, accroche en Fraunces, liste des capacités du produit) + panneau de formulaire épuré. Repli en une seule colonne sous `lg`.

**Coquille applicative** (`src/components/AppShell.tsx`, nouveau) — remplace l'en-tête horizontal minimal par une **barre latérale** façon SaaS professionnel (Linear/Stripe) : logo, navigation avec icônes `lucide-react`, badge "Bientôt" sur les sections pas encore construites (Caisse, Catalogue & stock, Achats & livraisons, Clients, Rapports, Journal d'audit — **honnête, pas de fausse démo** : ces liens sont désactivés, pas des pages vides qui font semblant de fonctionner), bloc utilisateur (initiales, nom, rôle) + déconnexion en bas.

**Tableau de bord** (`src/pages/DashboardPage.tsx`, nouveau) — écran d'accueil post-connexion honnête : message de bienvenue personnalisé (`user.firstName`) + grille de cartes décrivant les modules à venir. **Délibérément aucune statistique inventée** (pas de faux KPI, pas de faux graphique) — l'API ne les fournit pas encore, un dashboard avec des chiffres fictifs serait trompeur.

**Vérifié de bout en bout** — rebuild + pilotage Playwright identique à la vérification initiale (voir `supermarket-backend/docs/PROGRESS.md`, entrée du 2026-09-02) : écran de connexion capturé, connexion réussie contre le vrai backend, tableau de bord post-connexion capturé et conforme au design attendu.

## 2026-09-02 — Scaffold initial

Voir `supermarket-backend/docs/PROGRESS.md` (entrée "Démarrage du client Electron") pour le détail complet du scaffold React + Vite + TypeScript + Tailwind v4 + shadcn/ui + lucide-react sur Electron Forge, et les 4 pièges Forge/Vite/Tailwind v4 rencontrés.
