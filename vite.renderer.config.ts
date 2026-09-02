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
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
  };
});
