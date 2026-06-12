const BASE64URL =
  "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_";

function utf8Encode(text: string): Uint8Array {
  return new TextEncoder().encode(text);
}

export function generateMessageId(): string {
  const bytes = new Uint8Array(12);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

export async function deriveMessageKey(
  vaultKey: string,
  messageId: string,
): Promise<string> {
  const material = utf8Encode(`${vaultKey}:${messageId}:ee3`);
  const hash = await crypto.subtle.digest("SHA-256", material as BufferSource);
  return Array.from(new Uint8Array(hash), (b) =>
    b.toString(16).padStart(2, "0"),
  ).join("");
}

function xorWithKeyBytes(data: Uint8Array, keyBytes: Uint8Array): Uint8Array {
  const out = new Uint8Array(data.length);
  for (let i = 0; i < data.length; i++) {
    out[i] = data[i] ^ keyBytes[i % keyBytes.length];
  }
  return out;
}

export function xorEncryptWithBytes(
  plaintext: string,
  keyHex: string,
): Uint8Array {
  const data = utf8Encode(plaintext);
  const keyBytes = utf8Encode(keyHex);
  return xorWithKeyBytes(data, keyBytes);
}

export function toBase64Url(bytes: Uint8Array): string {
  let bits = 0;
  let value = 0;
  let output = "";

  for (const byte of bytes) {
    value = (value << 8) | byte;
    bits += 8;
    while (bits >= 6) {
      bits -= 6;
      output += BASE64URL[(value >> bits) & 0x3f];
    }
  }

  if (bits > 0) {
    output += BASE64URL[(value << (6 - bits)) & 0x3f];
  }

  return output;
}

export async function encryptPayload(
  payload: unknown,
  vaultKey: string,
  messageId: string,
): Promise<string> {
  const messageKey = await deriveMessageKey(vaultKey, messageId);
  const json = JSON.stringify(payload);
  const encrypted = xorEncryptWithBytes(json, messageKey);
  return toBase64Url(encrypted);
}
