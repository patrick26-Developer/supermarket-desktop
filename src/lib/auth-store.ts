/**
 * Jeton d'accès en mémoire uniquement — pas de stockage persistant
 * (`safeStorage`) pour l'instant, voir docs/ROADMAP.md du backend
 * ("Authentification côté client" reste à faire). Se perd donc à chaque
 * redémarrage de l'app : c'est un choix assumé, pas un oubli.
 */

let accessToken: string | null = null;

export function setAccessToken(token: string | null) {
  accessToken = token;
}

export function getAccessToken(): string | null {
  return accessToken;
}
