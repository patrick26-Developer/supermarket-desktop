export function formatCurrency(amount: number): string {
  return `${Math.round(amount).toLocaleString("fr-FR")} FCFA`;
}
