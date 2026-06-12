const BASE64URL =
  "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_";

export function generatePrivacyKey(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

function utf8Encode(text: string): Uint8Array {
  return new TextEncoder().encode(text);
}

function utf8Decode(bytes: Uint8Array): string {
  return new TextDecoder().decode(bytes);
}

export function xorEncrypt(plaintext: string, key: string): Uint8Array {
  const data = utf8Encode(plaintext);
  const keyBytes = utf8Encode(key);
  const out = new Uint8Array(data.length);
  for (let i = 0; i < data.length; i++) {
    out[i] = data[i] ^ keyBytes[i % keyBytes.length];
  }
  return out;
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

export function encryptPayload(payload: unknown, privacyKey: string): string {
  const json = JSON.stringify(payload);
  const encrypted = xorEncrypt(json, privacyKey);
  return toBase64Url(encrypted);
}
