/**
 * Access token lives only in memory (never localStorage) to limit XSS blast
 * radius. It's a plain module — not React state — so services/api.ts can
 * read the latest value without depending on hooks/useAuth.tsx.
 */
let accessToken: string | null = null;

export function getAccessToken(): string | null {
  return accessToken;
}

export function setAccessToken(token: string | null): void {
  accessToken = token;
}
