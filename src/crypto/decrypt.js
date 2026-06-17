/**
 * Runtime AES-256-GCM decryption using the Web Crypto API.
 *
 * Mirrors the parameters used by scripts/encrypt-content.mjs:
 *   - PBKDF2-SHA256, 600,000 iterations, 256-bit derived key
 *   - AES-256-GCM with 96-bit IV, 128-bit auth tag
 *
 * If the password is wrong, decryption throws (GCM auth tag fails).
 */

const PBKDF2_ITERATIONS = 600_000;
const KEY_LENGTH_BITS = 256;

function base64ToBytes(b64) {
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

async function deriveKey(password, salt) {
  const enc = new TextEncoder();
  const baseKey = await crypto.subtle.importKey(
    'raw',
    enc.encode(password),
    { name: 'PBKDF2' },
    false,
    ['deriveKey']
  );
  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt,
      iterations: PBKDF2_ITERATIONS,
      hash: 'SHA-256',
    },
    baseKey,
    { name: 'AES-GCM', length: KEY_LENGTH_BITS },
    false,
    ['decrypt']
  );
}

/**
 * @param {{ salt:string, iv:string, tag:string, data:string }} payload
 * @param {string} password
 * @returns {Promise<object>} the decrypted JSON payload
 */
export async function decryptPayload(payload, password) {
  const salt = base64ToBytes(payload.salt);
  const iv = base64ToBytes(payload.iv);
  const data = base64ToBytes(payload.data);
  const tag = base64ToBytes(payload.tag);

  // Web Crypto expects ciphertext || tag concatenated for GCM
  const ciphertextWithTag = new Uint8Array(data.length + tag.length);
  ciphertextWithTag.set(data, 0);
  ciphertextWithTag.set(tag, data.length);

  const key = await deriveKey(password, salt);
  const plaintextBuf = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv },
    key,
    ciphertextWithTag
  );

  const json = new TextDecoder().decode(plaintextBuf);
  return JSON.parse(json);
}
