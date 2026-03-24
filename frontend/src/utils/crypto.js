/**
 * End-to-End Encryption utilities using Web Crypto API (AES-256-GCM).
 *
 * The encryption key is generated entirely on the client and shared
 * via the URL hash fragment — which is NEVER sent to the server.
 * The server only ever sees opaque encrypted blobs.
 */

const ALGO = 'AES-GCM';
const KEY_LENGTH = 256;

/* ── Key generation & serialization ──────────────────────── */

/** Generate a fresh AES-256-GCM CryptoKey. */
export async function generateKey() {
  return crypto.subtle.generateKey(
    { name: ALGO, length: KEY_LENGTH },
    true,                           // extractable — needed for export
    ['encrypt', 'decrypt']
  );
}

/** Export a CryptoKey to a URL-safe base64 string. */
export async function exportKey(key) {
  const raw = await crypto.subtle.exportKey('raw', key);
  return bufToBase64(new Uint8Array(raw));
}

/** Import a base64 string back into a CryptoKey. */
export async function importKey(base64) {
  const raw = base64ToBuf(base64);
  return crypto.subtle.importKey(
    'raw',
    raw,
    { name: ALGO, length: KEY_LENGTH },
    true,
    ['encrypt', 'decrypt']
  );
}

/* ── Encrypt / Decrypt ───────────────────────────────────── */

/**
 * Encrypt a plaintext string → { encrypted, iv } (both base64).
 * Uses a random 96-bit IV for each message (recommended for GCM).
 */
export async function encryptMessage(key, plaintext) {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encoded = new TextEncoder().encode(plaintext);
  const ciphertext = await crypto.subtle.encrypt(
    { name: ALGO, iv },
    key,
    encoded
  );
  return {
    encrypted: bufToBase64(new Uint8Array(ciphertext)),
    iv: bufToBase64(iv),
  };
}

/**
 * Decrypt a message from base64 encrypted + iv → plaintext string.
 */
export async function decryptMessage(key, encryptedB64, ivB64) {
  const encrypted = base64ToBuf(encryptedB64);
  const iv = base64ToBuf(ivB64);
  const decrypted = await crypto.subtle.decrypt(
    { name: ALGO, iv },
    key,
    encrypted
  );
  return new TextDecoder().decode(decrypted);
}

/* ── URL hash helpers ────────────────────────────────────── */

/** Extract the encryption key from the current URL hash. */
export function getKeyFromHash() {
  const hash = window.location.hash;
  const match = hash.match(/key=([A-Za-z0-9+/=_-]+)/);
  return match ? match[1] : null;
}

/** Set the encryption key in the URL hash (no page reload). */
export function setKeyInHash(base64Key) {
  window.history.replaceState(null, '', `${window.location.pathname}#key=${base64Key}`);
}

/* ── Base64 ↔ Uint8Array helpers ─────────────────────────── */

function bufToBase64(buf) {
  let binary = '';
  for (const byte of buf) binary += String.fromCharCode(byte);
  return btoa(binary)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

function base64ToBuf(b64) {
  const padded = b64.replace(/-/g, '+').replace(/_/g, '/');
  const binary = atob(padded);
  const buf = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) buf[i] = binary.charCodeAt(i);
  return buf;
}
