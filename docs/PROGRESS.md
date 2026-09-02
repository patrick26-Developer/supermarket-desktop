# Journal d'avancement — Supermarket Desktop

> Voir [ARCHITECTURE.md](./ARCHITECTURE.md) pour le contexte technique.

## 2026-09-02 — Les 5 onglets restants : Catalogue & stock, Achats & livraisons, Clients, Rapports, Journal d'audit

Demande explicite : enchaîner tous les onglets restants sans interruption, jusqu'à couverture complète de la sidebar (7 items — Tableau de bord et Caisse déjà faits). Fait, chacun branché sur de vraies routes backend, pas des maquettes.

**`src/lib/api.ts` étendu** — types + méthodes pour `categories`, `suppliers`, `purchaseOrders`, `goodsReceipts`, `deliveries`, `customers`, `auditLogs`, `reports` (sales-summary/stock-value/top-products). `src/hooks/use-default-store.ts` (nouveau) — dérive le magasin courant depuis la première caisse active, réutilisé par tous les nouveaux onglets (toujours pas d'endpoint `/stores` ni de sélecteur multi-magasin côté backend, V1 mono-magasin assumée). `src/components/ui/badge.tsx` (nouveau) — pastilles de statut réutilisées partout (commandes, livraisons, type client, action d'audit).

**Catalogue & stock** (`CataloguePage.tsx`) — liste produits (recherche, catégorie, coût, TVA, stock réel par magasin, statut), formulaire de création inline (slug auto-généré depuis le nom).

**Achats & livraisons** (`PurchasingPage.tsx` + `components/purchasing/`) — trois sections : Fournisseurs (liste + création), Commandes fournisseurs (liste avec statut, création avec recherche produit + lignes qté/coût éditables, actions contextuelles selon statut — Soumettre/Approuver/Annuler/Réceptionner ; "Réceptionner" récupère les lignes de la commande via `GET /purchase-orders/:id` et poste une réception avec les mêmes quantités), Livraisons (liste + bouton d'avancement de statut au prochain palier).

**Clients** (`ClientsPage.tsx`) — liste + création (bascule Particulier/Entreprise, champs adaptés).

**Rapports** (`ReportsPage.tsx`) — cartes KPI (ventes, chiffre d'affaires, panier moyen, TVA collectée) + tableau produits les plus vendus + tableau de valorisation du stock, tous sur données réelles (`/reports/*`).

**Journal d'audit** (`AuditPage.tsx`) — liste filtrable par action, connectée à `/audit-logs`.

**Tableau de bord retravaillé** — les cartes "modules à venir" n'avaient plus de sens une fois tous les onglets construits : remplacées par des cartes cliquables vers chaque onglet (navigation réelle, `onNavigate` maintenant remonté dans `App.tsx`) + un résumé de ventes en direct (réutilise `/reports/sales-summary`).

**Vérifié de bout en bout, les 5 onglets, en une passe** — build packagé, piloté par Playwright : connexion → clic sur chaque onglet → attente du contenu réel → capture. **Zéro erreur** (page, requête réseau, console) sur l'ensemble du parcours. Données réelles observées : fournisseur "Grossiste Congo", commande `PO-...` au statut REÇU (160 000 FCFA), 2 livraisons (une EN ATTENTE, une LIVRÉE), client "Jean Mabiala", rapport de ventes cohérent avec les tests de la session précédente (12 ventes, valorisation du stock 511 000 FCFA).

## 2026-09-02 — Pivot palette (retour utilisateur), barre de titre custom, module Caisse

**Retour utilisateur sur le design du 2026-09-02 (entrée précédente)** : le vert forêt + accent terracotta lisait "couleur de pharmacie", pas assez "grande distribution". Nouvelle direction demandée explicitement : s'inspirer de la qualité UI/UX d'un admin panel type NiceAdmin (pas forcément son bleu littéral — clarifié en cours de session : "NiceAdmin c'est juste pour s'inspirer de la qualité du UI UX Design"), et choisir une vraie palette sourcée (pas inventée en OKLCH à la main) sur [palettedecouleur.net](https://www.palettedecouleur.net/).

**Palette retenue** — Palette 787 du site : `#317AC1` (bleu, primaire), `#384454` (ardoise foncée, panneau de marque/texte), `#E1A624` (or, accent réservé aux mises en avant ponctuelles), `#D4D3DC`/`#AD956B` (neutres). Fond `#F5F6FA` (gris très clair, pas blanc pur), cartes blanches — direction "admin panel professionnel" plutôt que boutique éditoriale. `src/index.css` réécrit en conséquence (light + dark).

**Typographie simplifiée** — Fraunces (serif éditorial) abandonné entièrement, `@fontsource-variable/fraunces` désinstallé. Manrope seul, y compris pour les titres (`font-semibold`/`font-bold` au lieu d'une seconde police) — cohérent avec un rendu "logiciel professionnel" plutôt que "magazine".

**Écran de connexion et coquille re-stylés** — même structure (panneau de marque + formulaire), recoloré ; l'animation de dérive lente des halos décoratifs a été retirée (jugée trop "artsy" pour un logiciel de caisse). Barre latérale (`AppShell.tsx`) passée d'un indicateur actif plein fond à un **indicateur bleu à gauche de l'item actif** (pattern universel d'admin panel), navigation maintenant réellement fonctionnelle (voir plus bas).

**Boutons système custom** (`src/components/TitleBar.tsx`, `src/main.ts`, `src/preload.ts`) — fenêtre passée en `frame:false`, barre de titre entièrement dessinée côté renderer (réduire/agrandir-restaurer/fermer, double-clic pour maximiser), pont `window.windowControls` exposé via `contextBridge` (le renderer n'a pas accès direct à `BrowserWindow` sous `contextIsolation`).

**Logo intégré** (`assets/images/logo.{ico,png}`, fournis par l'utilisateur — un panier de courses sous un auvent, rouge brique + or, fond transparent) — vérifiés avant intégration (`.ico` : en-tête `ICONDIR` valide, une seule résolution 256×256 en PNG-compressé, fonctionnel mais pas optimal aux petites tailles ; `.png` : 1254×1254 propre). Câblés dans `main.ts` (icône fenêtre/barre des tâches), `forge.config.ts` (icône du packager + de l'installeur Squirrel), `index.html` (favicon), et dans l'UI (`TitleBar`, `AppShell`, `LoginPage`).

**Piège rencontré : image cassée en build packagé, invisible en dev** — `<img src="/images/logo.png">` fonctionne en dev (servi par le serveur Vite, la racine `/` a un sens) mais casse en production (`ERR_FILE_NOT_FOUND`) : l'app packagée charge `index.html` via `file://`, où un chemin commençant par `/` se résout à la racine du **disque**, pas du dossier de l'app. Corrigé en import Vite standard (`import logoUrl from "@/assets/images/logo.png"`, fichier déplacé dans `src/assets/`) plutôt qu'un chemin `publicDir` absolu — Vite réécrit alors l'URL correctement dans les deux contextes. Retenir : **ne jamais référencer une image par chemin absolu `/...` dans un composant** d'une app Electron packagée ; toujours passer par un import de module.

**Premier onglet fonctionnel : Caisse** (`src/pages/CashierPage.tsx`, `src/components/pos/`, `src/hooks/use-cart.ts`) — flux de vente réel, pas une maquette : ouverture/reprise de session de caisse (`GET/POST /api/cash-sessions`), recherche produit avec debounce (`GET /api/products?search=`) affichant le stock réel par magasin (`GET /api/stock`), panier éditable (quantité/prix unitaire — **pas de prix par magasin côté backend**, le prix est pré-rempli avec `costPrice` mais le caissier doit le confirmer, message explicite dans l'UI), calcul de sous-total/TVA/total répliquant exactement la logique serveur, choix du mode de paiement (avec case "simuler un échec" pour les méthodes mobile money simulées), `POST /api/sales` sur "Encaisser". **Vérifié de bout en bout contre le vrai backend** : vente réelle passée (Riz 5kg, 3500 FCFA), stock décrémenté 147→146, panier vidé après succès.

**Jeton d'authentification enfin propagé** (`src/lib/auth-store.ts`) — jusqu'ici le token reçu au login n'était jamais réutilisé pour les appels suivants (gap silencieux depuis le scaffold initial). Stocké en mémoire seulement (pas de `safeStorage`, toujours pas fait), attaché en `Authorization: Bearer` par `src/lib/api.ts`.

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
