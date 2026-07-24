type RandomIdCrypto = {
  randomUUID?: () => string;
  getRandomValues?: (array: Uint8Array) => Uint8Array;
};

export function createClientId(cryptoApi?: RandomIdCrypto): string {
  const source = cryptoApi ?? (globalThis.crypto as RandomIdCrypto | undefined);
  if (typeof source?.randomUUID === 'function') return source.randomUUID();
  if (typeof source?.getRandomValues !== 'function') {
    throw new Error('当前浏览器无法安全生成用户标识，请更换浏览器后重试。');
  }

  // randomUUID 只在安全上下文可用；getRandomValues 可在 HTTP 测试环境安全生成随机字节。
  const bytes = source.getRandomValues(new Uint8Array(16));
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}
