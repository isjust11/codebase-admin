/** Origins allowed as post-OAuth frontend redirects (CLIENT_URL may be comma-separated). */
export function allowedOAuthClientOrigins(): string[] {
  const fromClient = (process.env.CLIENT_URL || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  const fromMobile = (process.env.MOBILE_ORIGINS || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  return [...new Set([...fromClient, ...fromMobile])];
}

export function defaultOAuthClientOrigin(): string {
  return allowedOAuthClientOrigins()[0] || 'http://localhost:3200';
}

/** Encode an absolute origin into OAuth `state` (base64url). */
export function encodeOAuthRedirectState(redirectOrigin: string): string {
  return Buffer.from(redirectOrigin, 'utf8').toString('base64url');
}

/**
 * Resolve post-login frontend origin from OAuth `state` / `redirect` query.
 * Only origins listed in CLIENT_URL / MOBILE_ORIGINS are accepted.
 */
export function resolveOAuthClientOrigin(stateOrRedirect?: string | null): string {
  const fallback = defaultOAuthClientOrigin();
  if (!stateOrRedirect || typeof stateOrRedirect !== 'string') return fallback;

  let candidate = stateOrRedirect.trim();
  try {
    const decoded = Buffer.from(candidate, 'base64url').toString('utf8');
    if (decoded.startsWith('http://') || decoded.startsWith('https://')) {
      candidate = decoded;
    }
  } catch {
    // keep raw candidate (may already be an absolute URL)
  }

  try {
    const origin = new URL(candidate).origin;
    const allowed = allowedOAuthClientOrigins();
    const ok = allowed.some((entry) => {
      try {
        return new URL(entry).origin === origin;
      } catch {
        return entry === origin;
      }
    });
    if (ok) return origin;
  } catch {
    // invalid URL
  }
  return fallback;
}
