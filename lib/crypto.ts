import "server-only";

/**
 * PIN-at-rest encryption — SERVER ONLY (AES-256-GCM, Node crypto).
 *
 * The `server-only` import makes the build fail if this module is ever pulled
 * into a client bundle, so `PIN_ENCRYPTION_KEY` can never leak to the browser.
 * Per the plan, ONLY this module reads `PIN_ENCRYPTION_KEY`.
 *
 * `encryptPin` runs during fulfilment (store the CellGods PIN as ciphertext);
 * `decryptPin` runs ONLY inside the ownership-checked `/api/rentals/[id]/pin`
 * route. The on-disk shape is `"iv:tag:ciphertext"` with each part base64.
 *
 * Fails closed and loudly: a missing or wrong-length key throws a clear error
 * rather than silently encrypting with a bad key.
 */

import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";

const ALGORITHM = "aes-256-gcm";
const KEY_BYTES = 32; // AES-256
const IV_BYTES = 12; // 96-bit nonce, the recommended size for GCM

/**
 * Load and validate the 32-byte AES key from `PIN_ENCRYPTION_KEY` (base64).
 *
 * Read lazily (not at module load) so importing this file never crashes a
 * build where the env is absent; the failure surfaces clearly the moment a
 * PIN is actually encrypted or decrypted.
 */
function getKey(): Buffer {
  const raw = process.env.PIN_ENCRYPTION_KEY;
  if (!raw) {
    throw new Error(
      "PIN_ENCRYPTION_KEY is not set — cannot encrypt or decrypt PINs.",
    );
  }

  const key = Buffer.from(raw, "base64");
  if (key.length !== KEY_BYTES) {
    throw new Error(
      `PIN_ENCRYPTION_KEY must be base64 for exactly ${KEY_BYTES} bytes ` +
        `(AES-256); decoded to ${key.length} bytes.`,
    );
  }

  return key;
}

/**
 * Encrypt a plaintext PIN. Returns `"iv:tag:ciphertext"` with each segment
 * base64-encoded. A fresh random IV is generated per call, so encrypting the
 * same PIN twice yields different blobs.
 */
export function encryptPin(plain: string): string {
  const key = getKey();
  const iv = randomBytes(IV_BYTES);

  const cipher = createCipheriv(ALGORITHM, key, iv);
  const ciphertext = Buffer.concat([
    cipher.update(plain, "utf8"),
    cipher.final(),
  ]);
  const tag = cipher.getAuthTag();

  return [
    iv.toString("base64"),
    tag.toString("base64"),
    ciphertext.toString("base64"),
  ].join(":");
}

/**
 * Decrypt a blob produced by {@link encryptPin}. Throws if the key is
 * missing/wrong length, the blob is malformed, or authentication fails
 * (tampered ciphertext / wrong key).
 */
export function decryptPin(blob: string): string {
  const key = getKey();

  const parts = blob.split(":");
  if (parts.length !== 3) {
    throw new Error(
      'Malformed PIN ciphertext: expected "iv:tag:ciphertext" (3 base64 parts).',
    );
  }

  const [ivB64, tagB64, ctB64] = parts;
  const iv = Buffer.from(ivB64, "base64");
  const tag = Buffer.from(tagB64, "base64");
  const ciphertext = Buffer.from(ctB64, "base64");

  if (iv.length !== IV_BYTES) {
    throw new Error(
      `Malformed PIN ciphertext: IV must decode to ${IV_BYTES} bytes ` +
        `(got ${iv.length}).`,
    );
  }

  const decipher = createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(tag);

  const plain = Buffer.concat([
    decipher.update(ciphertext),
    decipher.final(),
  ]);

  return plain.toString("utf8");
}
