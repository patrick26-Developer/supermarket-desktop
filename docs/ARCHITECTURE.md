# Architecture — Supermarket Desktop (Superette)

> Dernière mise à jour : 2026-09-04

## 1. Vue d'ensemble

Client desktop Electron pour la gestion d'une chaîne de superettes, consommant l'API REST du [supermarket-backend](../../supermarket-backend/) (dossier frère). Voir `supermarket-backend/docs/ARCHITECTURE.md` pour le backend.

```
┌─────────────────────────┐        HTTP/REST        ┌──────────────────────────┐
│  Electron (ce projet)   │ ───────────────────────▶ │   NestJS API              │
│  React + Vite + Tailwind │ ◀─────────────────────── │   (supermarket-backend)  │
└─────────────────────────┘                           └──────────────────────────┘
```

## 2. Stack technique

| Couche | Choix |
|---|---|
| Shell desktop | Electron Forge (`@electron-forge/*` ^7.11, plugin Vite) |
| UI | React 19 + TypeScript ^5.9 |
| Build | Vite 5, trois configs séparées (`vite.main.config.ts`, `vite.preload.config.ts`, `vite.renderer.config.ts`) |
| Style | TailwindCSS v4 (`@tailwindcss/vite`, pas de `tailwind.config.js` — thème en CSS via `@theme`) |
| Composants | shadcn/ui, style "new-york", posé manuellement (voir gotcha ci-dessous) |
| Icônes | lucide-react |
| Typographie | `Manrope Variable` seule (titres inclus), auto-hébergée via `@fontsource-variable/manrope` — pas de CDN à l'exécution |
| Palette | Bleu/ardoise/or sourcé sur palettedecouleur.net (Palette 787) + 8 teintes "spectre" pour catégories/modules (`--spectrum-*`, dégradés, pas d'ombres portées) — jetons dans `src/index.css`, détail dans `docs/PROGRESS.md` |
| Animation | `motion` (Framer Motion), micro-interactions ciblées (transitions d'entrée, listes en cascade) — jamais sur les actions répétitives de caisse |
| Graphiques | `recharts` — aire, barres, donut sur l'onglet Rapports |
| Thème | Clair/sombre, `src/hooks/use-theme.ts`, persisté (`localStorage`) + `prefers-color-scheme` |
| Internationalisation | FR/EN maison (`src/lib/i18n/`), pas de lib externe — dictionnaire + contexte React |

## 3. Structure du dépôt

```
supermarket-desktop/
├── src/
│   ├── main.ts               # process main Electron — BrowserWindow frame:false, IPC boutons système
│   ├── preload.ts            # contextBridge — expose window.windowControls au renderer
│   ├── renderer.tsx          # point d'entrée du renderer — monte React dans #root
│   ├── App.tsx               # racine React — login / app + routage d'onglet (NavTab)
│   ├── vite-env.d.ts         # types Vite (import.meta.env)
│   ├── index.css             # import Tailwind + thème (variables CSS)
│   ├── assets/images/        # logo.png importé par les composants (voir gotcha ci-dessous)
│   ├── types/
│   │   ├── nav.ts            # NavTab (onglets de la sidebar)
│   │   └── window-controls.d.ts
│   ├── hooks/
│   │   ├── use-cart.ts           # état du panier de la Caisse (lignes, totaux)
│   │   ├── use-default-store.ts  # magasin courant, dérivé de la première caisse active
│   │   └── use-theme.ts          # thème clair/sombre, persisté
│   ├── lib/
│   │   ├── api.ts            # client fetch (auth Bearer + endpoints typés, tous les modules)
│   │   ├── auth-store.ts     # jeton d'accès en mémoire
│   │   ├── format.ts         # formatCurrency (FCFA), slugify, formatDate
│   │   ├── category-colors.ts # teinte "spectre" déterministe par nom de catégorie (pastilles, tuiles)
│   │   ├── category-icons.tsx # icône Lucide déterministe par nom de catégorie (repli ProductAvatar)
│   │   ├── permissions.ts     # can()/canSeeTab() — gating RBAC des onglets/actions par permission réelle
│   │   ├── utils.ts          # cn() — helper shadcn (clsx + tailwind-merge)
│   │   └── i18n/              # I18nProvider/useI18n + dictionnaire fr/en
│   ├── components/
│   │   ├── ui/                # composants shadcn (Button, Input, Label, Card, Badge, Dialog…) — zéro shadow-*, dégradés à la place
│   │   ├── pos/                # ProductSearch (grille de tuiles avec image), CartPanel (miniature par ligne) — écran Caisse
│   │   ├── catalogue/          # ProductAvatar (image, sinon icône+teinte de catégorie), ImageUploadField (upload réel + lien), CategoriesSection (CRUD)
│   │   ├── purchasing/         # SuppliersSection, PurchaseOrdersSection (+ détails lecture seule), DeliveriesSection (+ détails/historique statut)
│   │   ├── reports/            # Charts.tsx — graphiques recharts
│   │   ├── UserAvatar.tsx      # photo de profil ou initiales — sidebar, page Profil
│   │   ├── AvatarUploadField.tsx # upload de photo de profil (POST /uploads/avatar)
│   │   ├── TitleBar.tsx        # barre de titre custom (boutons système + thème + langue)
│   │   └── AppShell.tsx        # sidebar + navigation + menu utilisateur (Profil/Paramètres/Déconnexion)
│   └── pages/
│       ├── LoginPage.tsx      # écran de connexion plein écran (2 panneaux), câblé sur l'API, lien "mot de passe oublié"
│       ├── DashboardPage.tsx  # accueil post-connexion — résumé de ventes réel + cartes de nav
│       ├── CashierPage.tsx    # Caisse — session, recherche produit (grille avec images), panier, encaissement
│       ├── CataloguePage.tsx  # Catalogue & stock — grille de produits groupée par catégorie, CRUD complet + détails + image, tri/filtre/recherche
│       ├── PurchasingPage.tsx # Achats & livraisons — fournisseurs (CRUD + détails), commandes (détails lecture seule), livraisons (détails)
│       ├── ClientsPage.tsx    # Clients — liste + création/édition + détails + gestion des adresses, recherche
│       ├── ReportsPage.tsx    # Rapports — KPI, 3 graphiques, tableaux triables
│       ├── AuditPage.tsx      # Journal d'audit — filtrable (action, ressource, recherche)
│       ├── UsersPage.tsx      # Utilisateurs (SUPER_ADMIN/ADMIN) — comptes, détails + gestion des rôles, reset mot de passe
│       ├── ProfilePage.tsx    # Profil — infos perso, photo, changement de mot de passe (libre-service)
│       └── SettingsPage.tsx   # Paramètres — thème, langue, rôle(s), ancienneté, note "mot de passe oublié"
├── forge.config.ts          # config Electron Forge (makers, fuses, plugin Vite)
├── forge.env.d.ts           # déclare les globales injectées par le plugin Vite
├── components.json          # config shadcn/ui (alias, style, base color)
├── vite.main.config.ts / vite.preload.config.ts / vite.renderer.config.ts
└── docs/                    # ce dossier
```

## 4. Connexion au backend

`src/lib/api.ts` centralise les appels HTTP. URL de base configurable via `VITE_API_URL` (variable Vite, préfixée obligatoirement), défaut `http://localhost:3000/api` (backend en dev local, voir `supermarket-backend/.env` — `PORT=3000`, `API_PREFIX=api`). Le backend a `CORS` ouvert (`origin: true`) donc aucune configuration supplémentaire n'est nécessaire côté client.

Réponse de `POST /auth/login` : `{ accessToken, refreshToken, user: { id, email, firstName, lastName, roles } }`. Le token est gardé en mémoire (`src/lib/auth-store.ts`) et injecté en `Authorization: Bearer` sur tous les appels suivants par `src/lib/api.ts`. **Pas encore fait** : stockage sécurisé (`safeStorage` côté process main — actuellement perdu à chaque redémarrage), refresh automatique du token expiré.

**RBAC côté client** : juste après le login, `App.tsx` appelle `GET /auth/me/permissions` (une fois, pas re-fetché en cours de session) et distribue le résultat à `AppShell` et aux pages — voir `src/lib/permissions.ts`. Chaque onglet/bouton Créer-Modifier-Supprimer n'est affiché que si la permission correspondante est présente ; le backend reste la seule source de vérité (toute vérification côté client est un filtre d'affichage, jamais une garantie de sécurité).

**Magasin courant** : pas d'endpoint `/stores` ni de sélecteur multi-magasin côté backend (V1 mono-magasin assumée, voir `docs/ROADMAP.md` du backend). `src/hooks/use-default-store.ts` dérive le `storeId` de la première caisse active (`GET /cash-registers`) — utilisé par Catalogue, Achats, Clients et Rapports. À revoir le jour où le backend expose plusieurs magasins.

## 5. Gotchas connus (Electron Forge + Vite + Tailwind v4)

Voir `supermarket-backend/docs/PROGRESS.md` (entrée du 2026-09-02) pour le détail complet. En résumé :

1. **`@tailwindcss/vite` est ESM-only**, mais le plugin Vite d'Electron Forge charge les fichiers de config en CommonJS. Ne **jamais** passer `"type": "module"` dans `package.json` pour contourner ça — ça casse le process main (généré en CJS par le plugin). Le fix retenu : importer le plugin dynamiquement dans `vite.renderer.config.ts` (`defineConfig(async () => { const { default: tailwindcss } = await import("@tailwindcss/vite"); ... })`).
2. **`tsconfig.json`** doit explicitement inclure `forge.env.d.ts` (déclare `MAIN_WINDOW_VITE_DEV_SERVER_URL`/`MAIN_WINDOW_VITE_NAME`) si `include` est restreint à `src/`.
3. Le fuse `EnableNodeCliInspectArguments: false` (activé par défaut dans `forge.config.ts`) empêche tout outil d'automatisation (Playwright, etc.) de piloter un **build packagé**. Pour des vérifications automatisées, piloter le build non packagé (`.vite/build/`, généré par `npm run package` avant l'étape de packaging) via le binaire Electron brut (`node_modules/electron/dist/electron.exe <dossier-projet>`).
4. `npx shadcn@latest init` reste bloqué indéfiniment en environnement non interactif sur cette machine — composants posés à la main à la place (voir `components.json` et `src/components/ui/`).
5. **Ne jamais référencer une image par chemin absolu `/...` dans un composant** (`<img src="/images/logo.png">`). Fonctionne en dev (servi par le serveur Vite, `/` a un sens), casse en build packagé (`ERR_FILE_NOT_FOUND`) : l'app packagée charge `index.html` via `file://`, où `/...` se résout à la racine du disque, pas du dossier de l'app. Toujours importer l'image comme un module (`import logoUrl from "@/assets/images/logo.png"`) — Vite réécrit alors l'URL correctement dans les deux contextes. Cette contrainte concerne spécifiquement les fichiers utilisés depuis des composants ; `index.html` lui-même peut référencer `/src/assets/...` dans un `<link>`/`<script>`, Vite le réécrit correctement au build.
6. Un changement dans `main.ts`/`preload.ts` ne se recharge **pas** à chaud (Vite HMR ne couvre que le renderer) — un `npm start` déjà lancé doit être tué et relancé entièrement pour que ces fichiers prennent effet.

## Documents liés

- [supermarket-backend/docs/ARCHITECTURE.md](../../supermarket-backend/docs/ARCHITECTURE.md)
- [supermarket-backend/docs/ROADMAP.md](../../supermarket-backend/docs/ROADMAP.md)
