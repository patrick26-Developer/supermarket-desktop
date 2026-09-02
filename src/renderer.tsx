/**
 * Point d'entrée du renderer Electron. Monte l'application React dans
 * le <div id="root"> de index.html.
 *
 * Voir https://electronjs.org/docs/tutorial/process-model pour la
 * distinction entre les contextes "main" et "renderer".
 */

import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import { App } from "./App";
import "./index.css";

const container = document.getElementById("root");
if (!container) {
  throw new Error("Élément #root introuvable dans index.html");
}

createRoot(container).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
