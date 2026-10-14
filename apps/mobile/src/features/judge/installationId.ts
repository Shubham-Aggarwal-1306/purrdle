import { storage } from '@/lib/storage';

const KEY = 'installation-id';

function randomId(): string {
  // Not a secret or an identifier tied to the person — only a rate-limit key for /judge.
  const hex = (n: number) =>
    Array.from({ length: n }, () => Math.floor(Math.random() * 16).toString(16)).join('');
  return `${hex(8)}-${hex(4)}-4${hex(3)}-${hex(4)}-${hex(12)}`;
}

/** Random per-install ID, created on first use and kept in MMKV (reset on reinstall). */
export function getInstallationId(): string {
  const existing = storage.getString(KEY);
  if (existing) return existing;
  const id = randomId();
  storage.set(KEY, id);
  return id;
}
