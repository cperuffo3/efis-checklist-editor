import { createCipheriv, createDecipheriv, randomBytes } from "crypto";

const CIPHER_TYPE = "aes-128-cbc";
const BLOCK_SIZE = 16;
const KEY = Buffer.from("81e06e41a93f3848", "ascii");

/** Decrypt a ForeFlight .fmd file buffer, returning the JSON string */
export function decrypt(data: Buffer): string {
  const iv = data.subarray(0, BLOCK_SIZE);
  const encrypted = data.subarray(BLOCK_SIZE);
  const decipher = createDecipheriv(CIPHER_TYPE, KEY, iv);
  const decrypted = Buffer.concat([
    decipher.update(encrypted),
    decipher.final(),
  ]);
  return decrypted.toString("utf-8");
}

/** Encrypt a JSON string into a ForeFlight .fmd file buffer */
export function encrypt(text: string): Buffer {
  const iv = randomBytes(BLOCK_SIZE);
  const cipher = createCipheriv(CIPHER_TYPE, KEY, iv);
  const encrypted = Buffer.concat([
    cipher.update(text, "utf-8"),
    cipher.final(),
  ]);
  return Buffer.concat([iv, encrypted]);
}
