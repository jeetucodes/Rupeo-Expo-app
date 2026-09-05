/**
 * google-auth.ts — Google Service Account OAuth 2.0 (JWT Bearer flow)
 *
 * Generates short-lived access tokens for Google APIs using a
 * service account JSON key. Uses Deno's built-in Web Crypto API
 * (RSASSA-PKCS1-v1_5 / SHA-256) — zero external dependencies.
 *
 * Scopes used across this project:
 *   - https://www.googleapis.com/auth/androidpublisher  (Play Developer API)
 *   - https://www.googleapis.com/auth/datastore          (Firestore REST API)
 */

/** Strip PEM headers and decode base64 → ArrayBuffer (PKCS#8 DER) */
function pemToDer(pem: string): ArrayBuffer {
  const b64 = pem
    .replace(/-----BEGIN PRIVATE KEY-----/g, '')
    .replace(/-----END PRIVATE KEY-----/g, '')
    .replace(/\s/g, '');
  const binary = atob(b64);
  const buf = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) buf[i] = binary.charCodeAt(i);
  return buf.buffer;
}

/** Encode object or string as base64url (URL-safe, no padding) */
function b64url(value: object | string): string {
  const str = typeof value === 'string' ? value : JSON.stringify(value);
  return btoa(str).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

/** Encode raw bytes as base64url */
function b64urlBytes(bytes: Uint8Array): string {
  return btoa(String.fromCharCode(...bytes))
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

/**
 * In-memory token cache: scope → { token, expiresAt }
 * Prevents redundant OAuth round-trips within the same Edge Function invocation.
 */
const _tokenCache = new Map<string, { token: string; expiresAt: number }>();

/**
 * Get a Google OAuth 2.0 access token for a service account.
 *
 * Flow:
 *   1. Build JWT header + claims
 *   2. Sign with RS256 using the service account private key
 *   3. POST the signed JWT to Google's token endpoint
 *   4. Return the resulting access_token (cached for 55 min)
 *
 * @param saEmail     client_email from service account JSON
 * @param privateKey  private_key from service account JSON (PEM, with \n as newlines)
 * @param scope       Space-separated Google API scope(s)
 */
export async function getGoogleAccessToken(
  saEmail: string,
  privateKey: string,
  scope: string,
): Promise<string> {
  // Serve from cache if still valid (Google tokens live 60 min; we cache for 55)
  const cached = _tokenCache.get(scope);
  if (cached && Date.now() < cached.expiresAt) {
    return cached.token;
  }

  const now = Math.floor(Date.now() / 1000);

  // ── Build JWT ──────────────────────────────────────────────────────────────
  const header  = b64url({ alg: 'RS256', typ: 'JWT' });
  const payload = b64url({
    iss: saEmail,
    scope,
    aud: 'https://oauth2.googleapis.com/token',
    iat: now,
    exp: now + 3600,
  });
  const signingInput = `${header}.${payload}`;

  // ── Sign with RS256 ────────────────────────────────────────────────────────
  const cryptoKey = await crypto.subtle.importKey(
    'pkcs8',
    pemToDer(privateKey),
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const sigBytes = await crypto.subtle.sign(
    'RSASSA-PKCS1-v1_5',
    cryptoKey,
    new TextEncoder().encode(signingInput),
  );
  const jwt = `${signingInput}.${b64urlBytes(new Uint8Array(sigBytes))}`;

  // ── Exchange JWT for access token ──────────────────────────────────────────
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body:
      'grant_type=urn%3Aietf%3Aparams%3Aoauth%3Agrant-type%3Ajwt-bearer' +
      `&assertion=${jwt}`,
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`[google-auth] OAuth token error ${res.status}: ${text}`);
  }

  const { access_token, expires_in } = (await res.json()) as {
    access_token: string;
    expires_in: number;
  };

  // Cache for expires_in - 5 min buffer
  _tokenCache.set(scope, {
    token: access_token,
    expiresAt: Date.now() + (expires_in - 300) * 1000,
  });

  return access_token;
}
