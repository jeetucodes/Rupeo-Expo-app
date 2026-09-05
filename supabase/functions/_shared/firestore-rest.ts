/**
 * firestore-rest.ts — Firestore REST API helper
 *
 * Updates Firestore user documents from Edge Functions using the
 * Firestore REST API (PATCH with field masks).
 * Uses the same Google service account as the Play API — just a different scope.
 *
 * Why REST instead of Firebase Admin SDK?
 *   Supabase Edge Functions run on Deno, and the Firebase Admin SDK is Node.js only.
 *   The Firestore REST API works perfectly from any HTTP client.
 *
 * Firestore REST docs:
 * https://cloud.google.com/firestore/docs/reference/rest/v1/projects.databases.documents/patch
 */

import { getGoogleAccessToken } from './google-auth.ts';

const DATASTORE_SCOPE    = 'https://www.googleapis.com/auth/datastore';
const FIRESTORE_BASE_URL = 'https://firestore.googleapis.com/v1';

// ─── Value serializers ────────────────────────────────────────────────────────

type FirestoreValue =
  | { booleanValue: boolean }
  | { stringValue: string }
  | { nullValue: null }
  | { integerValue: string }
  | { timestampValue: string };

function toFirestoreValue(v: unknown): FirestoreValue {
  if (v === null || v === undefined) return { nullValue: null };
  if (typeof v === 'boolean')        return { booleanValue: v };
  if (typeof v === 'number')         return { integerValue: String(v) };
  if (typeof v === 'string') {
    // Auto-detect ISO timestamp strings
    if (/^\d{4}-\d{2}-\d{2}T[\d:.Z+]+$/.test(v)) {
      return { timestampValue: v };
    }
    return { stringValue: v };
  }
  return { stringValue: String(v) };
}

// ─── Main update function ─────────────────────────────────────────────────────

/**
 * Update (PATCH) a Firestore user document via REST API.
 * Only the specified fields are updated (partial update via fieldMask).
 *
 * @param projectId  Firebase project ID (e.g. 'paisewaise-e545e')
 * @param userId     Firestore document ID (Firebase UID)
 * @param fields     Key-value pairs to update in the document
 * @param saEmail    Service account client_email
 * @param privateKey Service account private_key (PEM)
 */
export async function updateFirestoreUser(
  projectId: string,
  userId: string,
  fields: Record<string, unknown>,
  saEmail: string,
  privateKey: string,
): Promise<void> {
  const token = await getGoogleAccessToken(saEmail, privateKey, DATASTORE_SCOPE);

  // Build Firestore field map
  const firestoreFields: Record<string, FirestoreValue> = {};
  for (const [key, value] of Object.entries(fields)) {
    firestoreFields[key] = toFirestoreValue(value);
  }

  // Build updateMask query string (required for partial update)
  const fieldMask = Object.keys(fields)
    .map((k) => `updateMask.fieldPaths=${encodeURIComponent(k)}`)
    .join('&');

  const docPath =
    `${FIRESTORE_BASE_URL}/projects/${projectId}` +
    `/databases/(default)/documents/users/${userId}`;

  const res = await fetch(`${docPath}?${fieldMask}`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ fields: firestoreFields }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(
      `[firestore-rest] PATCH failed HTTP ${res.status}: ${text}`,
    );
  }

  console.log(`[firestore-rest] ✅ Updated users/${userId}:`, Object.keys(fields).join(', '));
}
