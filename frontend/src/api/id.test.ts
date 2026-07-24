import assert from 'node:assert/strict';
import test from 'node:test';

import { createClientId } from './id.ts';

test('优先使用浏览器 randomUUID', () => {
  const id = createClientId({ randomUUID: () => 'native-random-uuid' });
  assert.equal(id, 'native-random-uuid');
});

test('HTTP 环境使用 getRandomValues 生成标准 UUID v4', () => {
  const id = createClientId({
    getRandomValues: (bytes) => {
      bytes.set([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15]);
      return bytes;
    },
  });

  assert.equal(id, '00010203-0405-4607-8809-0a0b0c0d0e0f');
  assert.match(id, /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
});

test('没有安全随机源时拒绝生成标识', () => {
  assert.throws(() => createClientId({}), /无法安全生成用户标识/);
});
