# Architecture — Supermarket Desktop (Superette)

> Dernière mise à jour : 2026-09-02

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

## 3. Structure du dépôt

```
supermarket-desktop/
├── src/
│   ├── main.ts              # process main Electron — crée la BrowserWindow
│   ├── preload.ts           # script preload (vide pour l'instant)
│   ├── renderer.tsx         # point d'entrée du renderer — monte React dans #root
│   ├── App.tsx              # racine React — bascule login / app selon l'état
│   ├── vite-env.d.ts        # types Vite (import.meta.env)
│   ├── index.css            # import Tailwind + thème shadcn (variables CSS)
│   ├── lib/
│   │   ├── api.ts           # client fetch minimal vers l'API NestJS
│   │   └── utils.ts         # cn() — helper shadcn (clsx + tailwind-merge)
│   ├── components/ui/       # composants shadcn (Button, Input, Label, Card…)
│   └── pages/
│       └── LoginPage.tsx    # écran de connexion, câblé sur l'API
├── forge.config.ts          # config Electron Forge (makers, fuses, plugin Vite)
├── forge.env.d.ts           # déclare les globales injectées par le plugin Vite
├── components.json          # config shadcn/ui (alias, style, base color)
├── vite.main.config.ts / vite.preload.config.ts / vite.renderer.config.ts
└── docs/                    # ce dossier
```

## 4. Connexion au backend

`src/lib/api.ts` centralise les appels HTTP. URL de base configurable via `VITE_API_URL` (variable Vite, préfixée obligatoirement), défaut `http://localhost:3000/api` (backend en dev local, voir `supermarket-backend/.env` — `PORT=3000`, `API_PREFIX=api`). Le backend a `CORS` ouvert (`origin: true`) donc aucune configuration supplémentaire n'est nécessaire côté client.

Réponse de `POST /auth/login` : `{ accessToken, refreshToken, user: { id, email, firstName, lastName, roles } }`. **Pas encore fait** : stockage sécurisé du token (`safeStorage` côté process main), refresh automatique, intercepteur pour injecter le `Authorization: Bearer <token>` sur les appels suivants — le login actuel ne fait que prouver la connectivité de bout en bout.

## 5. Gotchas connus (Electron Forge + Vite + Tailwind v4)

Voir `supermarket-backend/docs/PROGRESS.md` (entrée du 2026-09-02) pour le détail complet. En résumé :

1. **`@tailwindcss/vite` est ESM-only**, mais le plugin Vite d'Electron Forge charge les fichiers de config en CommonJS. Ne **jamais** passer `"type": "module"` dans `package.json` pour contourner ça — ça casse le process main (généré en CJS par le plugin). Le fix retenu : importer le plugin dynamiquement dans `vite.renderer.config.ts` (`defineConfig(async () => { const { default: tailwindcss } = await import("@tailwindcss/vite"); ... })`).
2. **`tsconfig.json`** doit explicitement inclure `forge.env.d.ts` (déclare `MAIN_WINDOW_VITE_DEV_SERVER_URL`/`MAIN_WINDOW_VITE_NAME`) si `include` est restreint à `src/`.
3. Le fuse `EnableNodeCliInspectArguments: false` (activé par défaut dans `forge.config.ts`) empêche tout outil d'automatisation (Playwright, etc.) de piloter un **build packagé**. Pour des vérifications automatisées, piloter le build non packagé (`.vite/build/`, généré par `npm run package` avant l'étape de packaging) via le binaire Electron brut (`node_modules/electron/dist/electron.exe <dossier-projet>`).
4. `npx shadcn@latest init` reste bloqué indéfiniment en environnement non interactif sur cette machine — composants posés à la main à la place (voir `components.json` et `src/components/ui/`).

## Documents liés

- [supermarket-backend/docs/ARCHITECTURE.md](../../supermarket-backend/docs/ARCHITECTURE.md)
- [supermarket-backend/docs/ROADMAP.md](../../supermarket-backend/docs/ROADMAP.md)
