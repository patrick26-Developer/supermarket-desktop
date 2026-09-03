/**
 * Attribution déterministe d'une teinte du spectre (src/index.css) à un nom
 * de catégorie (ou tout autre libellé) — même catégorie ⇒ même couleur
 * partout dans l'app, sans registre à maintenir à la main. Inspiré des tags
 * de catégorie multicolores façon Amazon/Alibaba plutôt qu'un gris uniforme.
 */
const SPECTRUM_TONES = [
  "coral",
  "amber",
  "lime",
  "teal",
  "azure",
  "violet",
  "pink",
  "slate",
] as const;

export type SpectrumTone = (typeof SPECTRUM_TONES)[number];

function hashString(value: string): number {
  let hash = 0;
  for (let i = 0; i < value.length; i++) {
    hash = (hash << 5) - hash + value.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

export function toneFor(label: string): SpectrumTone {
  if (!label) return "slate";
  return SPECTRUM_TONES[hashString(label) % SPECTRUM_TONES.length];
}

// Classes complètes et littérales (pas de concaténation dynamique) — le
// scanner de Tailwind v4 détecte les classes par recherche textuelle dans le
// code source et ne résoudrait pas un template `bg-spectrum-${tone}/15`.
const PILL_CLASSES: Record<SpectrumTone, string> = {
  coral: "bg-spectrum-coral/15 text-spectrum-coral",
  amber: "bg-spectrum-amber/15 text-spectrum-amber",
  lime: "bg-spectrum-lime/15 text-spectrum-lime",
  teal: "bg-spectrum-teal/15 text-spectrum-teal",
  azure: "bg-spectrum-azure/15 text-spectrum-azure",
  violet: "bg-spectrum-violet/15 text-spectrum-violet",
  pink: "bg-spectrum-pink/15 text-spectrum-pink",
  slate: "bg-spectrum-slate/15 text-spectrum-slate",
};

const GRADIENT_CLASSES: Record<SpectrumTone, string> = {
  coral: "bg-gradient-to-br from-spectrum-coral to-spectrum-coral/70",
  amber: "bg-gradient-to-br from-spectrum-amber to-spectrum-amber/70",
  lime: "bg-gradient-to-br from-spectrum-lime to-spectrum-lime/70",
  teal: "bg-gradient-to-br from-spectrum-teal to-spectrum-teal/70",
  azure: "bg-gradient-to-br from-spectrum-azure to-spectrum-azure/70",
  violet: "bg-gradient-to-br from-spectrum-violet to-spectrum-violet/70",
  pink: "bg-gradient-to-br from-spectrum-pink to-spectrum-pink/70",
  slate: "bg-gradient-to-br from-spectrum-slate to-spectrum-slate/70",
};

/** Classes pour une pastille (fond teinté léger + texte plein). */
export function tonePillClasses(label: string): string {
  return PILL_CLASSES[toneFor(label)];
}

/** Classes pour un dégradé plein (icônes de module, en-têtes de section…). */
export function toneGradientClasses(label: string): string {
  return GRADIENT_CLASSES[toneFor(label)];
}
