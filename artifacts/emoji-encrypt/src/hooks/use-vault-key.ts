import { useCallback, useEffect, useState } from "react";
import {
  ensureVaultKey,
  getVaultKey,
  maskVaultKey,
  rotateVaultKey,
} from "@/lib/vault-key";
import { buildVaultBootstrap } from "@/lib/vault-bootstrap";

export function useVaultKey() {
  const [vaultKey, setVaultKeyState] = useState<string | null>(null);
  const [bootstrapPrompt, setBootstrapPrompt] = useState("");

  useEffect(() => {
    const key = ensureVaultKey();
    setVaultKeyState(key);
    setBootstrapPrompt(buildVaultBootstrap(key));
  }, []);

  const rotate = useCallback(() => {
    const key = rotateVaultKey();
    setVaultKeyState(key);
    setBootstrapPrompt(buildVaultBootstrap(key));
    return key;
  }, []);

  const refresh = useCallback(() => {
    const key = getVaultKey() ?? ensureVaultKey();
    setVaultKeyState(key);
    setBootstrapPrompt(buildVaultBootstrap(key));
  }, []);

  return {
    vaultKey,
    maskedVaultKey: vaultKey ? maskVaultKey(vaultKey) : null,
    bootstrapPrompt,
    rotate,
    refresh,
    isReady: Boolean(vaultKey),
  };
}
