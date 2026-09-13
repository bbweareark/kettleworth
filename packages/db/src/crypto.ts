import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";

/** AES-256-GCM field encryption for sensitive health data and provider tokens. Output: base64(iv | tag | ciphertext). */
function key(): Buffer {
  const k = process.env.HEALTH_DATA_ENCRYPTION_KEY;
  if (!k) throw new Error("HEALTH_DATA_ENCRYPTION_KEY is not set");
  const buf = Buffer.from(k, "base64");
  if (buf.length !== 32) throw new Error("HEALTH_DATA_ENCRYPTION_KEY must be 32 bytes base64");
  return buf;
}
export function encryptField(plain: string | null | undefined): string | null {
  if (plain == null || plain === "") return null;
  const iv = randomBytes(12);
  const c = createCipheriv("aes-256-gcm", key(), iv);
  const enc = Buffer.concat([c.update(plain, "utf8"), c.final()]);
  return Buffer.concat([iv, c.getAuthTag(), enc]).toString("base64");
}
export function decryptField(blob: string | null | undefined): string | null {
  if (!blob) return null;
  const b = Buffer.from(blob, "base64");
  const iv = b.subarray(0, 12), tag = b.subarray(12, 28), data = b.subarray(28);
  const d = createDecipheriv("aes-256-gcm", key(), iv);
  d.setAuthTag(tag);
  return Buffer.concat([d.update(data), d.final()]).toString("utf8");
}
export const encryptJson = (v: unknown) => encryptField(JSON.stringify(v));
export const decryptJson = <T>(blob: string | null | undefined): T | null => { const s = decryptField(blob); return s ? (JSON.parse(s) as T) : null; };
