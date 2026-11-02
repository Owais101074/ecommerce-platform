type SessionListener = () => void;

/**
 * The access token lives only in memory. A page reload recovers it through the
 * httpOnly refresh cookie, so no token is ever readable from localStorage.
 */
let accessToken: string | null = null;
const sessionExpiredListeners = new Set<SessionListener>();

export function getAccessToken(): string | null {
  return accessToken;
}

export function setAccessToken(token: string | null): void {
  accessToken = token;
}

export function clearAccessToken(): void {
  accessToken = null;
}

export function notifySessionExpired(): void {
  sessionExpiredListeners.forEach((listener) => listener());
}

export function onSessionExpired(listener: SessionListener): () => void {
  sessionExpiredListeners.add(listener);
  return () => {
    sessionExpiredListeners.delete(listener);
  };
}
