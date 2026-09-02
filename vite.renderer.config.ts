import path from "node:path";

import { defineConfig } from "vite";

// https://vitejs.dev/config
//
// @tailwindcss/vite est ESM-only. Le plugin Vite d'Electron Forge charge ce
// fichier de config en CommonJS (le package.json du projet n'a pas
// "type": "module", car le bundle du process main d'Electron Forge, lui,
// est généré en CJS et casserait avec `require is not defined in ES module
// scope`). Un import dynamique dans une factory async contourne le souci :
// il fonctionne aussi bien en CJS qu'en ESM.
export default defineConfig(async () => {
  const { default: tailwindcss } = await import("@tailwindcss/vite");
  return {
    plugins: [tailwindcss()],
    // Pas de publicDir : les images utilisées par le renderer vivent dans
    // src/assets/ et sont importées comme des modules (voir "@/assets/...")
    // plutôt que référencées en chemin absolu "/images/...". Un chemin
    // absolu servi depuis un vrai serveur HTTP (dev) se résout à la racine
    // du disque une fois l'app chargée en file:// (build packagé) —
    // ERR_FILE_NOT_FOUND en prod. assets/images/logo.ico à la racine du
    // projet reste utilisé tel quel par main.ts/forge.config.ts (Node pur,
    // aucun rapport avec Vite).
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
  };
});
