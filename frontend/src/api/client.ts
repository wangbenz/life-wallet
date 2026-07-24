import { createClientId } from './id.ts';

const OWNER_KEY_STORAGE = 'life-wallet.owner-key';
let memoryOwnerKey: string | null = null;

export function getOwnerKey(): string {
  if (memoryOwnerKey) return memoryOwnerKey;
  const stored = typeof localStorage === 'undefined' ? null : localStorage.getItem(OWNER_KEY_STORAGE);
  if (stored) return (memoryOwnerKey = stored);
  memoryOwnerKey = createClientId();
  if (typeof localStorage !== 'undefined') localStorage.setItem(OWNER_KEY_STORAGE, memoryOwnerKey);
  return memoryOwnerKey;
}

export function existingOwnerKey(): string | null {
  return memoryOwnerKey ?? (typeof localStorage === 'undefined' ? null : localStorage.getItem(OWNER_KEY_STORAGE));
}

export function resetOwnerKey(): void {
  if (typeof localStorage !== 'undefined') localStorage.removeItem(OWNER_KEY_STORAGE);
  memoryOwnerKey = null;
}

export class ApiError extends Error {
  status: number;
  code: string;

  constructor(status: number, code: string, message: string) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

export async function apiFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const response = await fetch(path, {
    ...init,
    headers: {
      'X-Life-Wallet-Owner-Key': getOwnerKey(),
      ...(init.body ? { 'Content-Type': 'application/json' } : {}),
      ...init.headers,
    },
  });
  const body = response.status === 204 ? null : await response.json().catch(() => null) as { code?: string; message?: string } | null;
  if (!response.ok) throw new ApiError(response.status, body?.code ?? 'REQUEST_FAILED', body?.message ?? '请求失败，请稍后再试。');
  return body as T;
}
