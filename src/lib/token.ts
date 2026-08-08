// Single source of truth for the admin auth token key.
// Keeps localStorage/sessionStorage access in one place so login, logout,
// the API clients, and the socket all agree on the same credential.

const TOKEN_KEY = 'anjani_admin_token';
const LEGACY_KEYS = ['eveng_admin_token', 'eveng_token', 'token'];

export function getAuthToken(): string | null {
  const primary = localStorage.getItem(TOKEN_KEY) || sessionStorage.getItem(TOKEN_KEY);
  if (primary) return primary;

  // One-time migration from the legacy fragmented keys.
  for (const legacyKey of LEGACY_KEYS) {
    const legacyToken = localStorage.getItem(legacyKey) || sessionStorage.getItem(legacyKey);
    if (legacyToken) {
      setAuthToken(legacyToken);
      return legacyToken;
    }
  }
  return null;
}

export function setAuthToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearAuthToken(): void {
  localStorage.removeItem(TOKEN_KEY);
  sessionStorage.removeItem(TOKEN_KEY);
  for (const legacyKey of LEGACY_KEYS) {
    localStorage.removeItem(legacyKey);
    sessionStorage.removeItem(legacyKey);
  }
}
