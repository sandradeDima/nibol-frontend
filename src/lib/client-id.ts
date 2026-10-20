export const createClientId = (prefix?: string): string => {
  // shortcut: fallback IDs are probabilistic; use server IDs for cross-device uniqueness.
  const id =
    typeof globalThis.crypto?.randomUUID === "function"
      ? globalThis.crypto.randomUUID()
      : `${Math.random().toString(36).slice(2, 8)}_${Date.now()}`;

  return prefix ? `${prefix}_${id}` : id;
};
