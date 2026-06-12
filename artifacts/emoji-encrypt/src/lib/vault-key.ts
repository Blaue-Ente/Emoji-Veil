const STORAGE_KEY = "ee3-vault-key";

export function generateVaultKey(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

export function getVaultKey(): string | null {
  try {
    return localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

export function setVaultKey(key: string): void {
  localStorage.setItem(STORAGE_KEY, key);
}

export function ensureVaultKey(): string {
  const existing = getVaultKey();
  if (existing) {
    return existing;
  }
  const key = generateVaultKey();
  setVaultKey(key);
  return key;
}

export function rotateVaultKey(): string {
  const key = generateVaultKey();
  setVaultKey(key);
  return key;
}

export function maskVaultKey(key: string): string {
  if (key.length <= 12) {
    return "••••••••";
  }
  return `${key.slice(0, 6)}${"•".repeat(16)}${key.slice(-6)}`;
}
