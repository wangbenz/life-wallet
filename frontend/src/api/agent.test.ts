import assert from 'node:assert/strict';
import test from 'node:test';
import { sendAgentMessage } from './agent.ts';
import { clearUserData } from './data.ts';
import type { TodayRecord } from '../mock/model.ts';

test('Agent 请求只发送工具决策需要的本地记录字段', async () => {
  const originalFetch = globalThis.fetch;
  let requestBody: Record<string, unknown> | null = null;
  let requestHeaders: Headers | null = null;
  globalThis.fetch = async (_input, init) => {
    requestBody = JSON.parse(String(init?.body)) as Record<string, unknown>;
    requestHeaders = new Headers(init?.headers);
    return new Response(JSON.stringify({
      conversationId: 'conv_1',
      turnId: 'turn_1',
      status: 'COMPLETED',
      message: '今天有 1 条记录。',
      recordIds: [1],
      pendingAction: null,
    }), { status: 200, headers: { 'Content-Type': 'application/json' } });
  };

  const record: TodayRecord = {
    recordId: 1,
    lifeDate: '2026-07-24',
    content: '上午工作 2 小时',
    status: 'CONFIRMED',
    createdAt: '2026-07-24T08:00:00Z',
    intent: 'RECORD_LIFE',
    summary: '工作是主要片段。',
    stateDescription: '',
    needsConfirmation: false,
    activities: [{
      title: '工作',
      durationMinutes: 120,
      dimension: '创造',
      domain: '工作',
      topic: '工作',
      estimated: false,
    }],
    dimensionSummary: [{ dimension: '创造', durationMinutes: 120 }],
  };

  try {
    const response = await sendAgentMessage({
      conversationId: null,
      message: '我今天记了什么？',
      lifeDate: '2026-07-24',
      contextRecordId: null,
      records: [record],
    });
    assert.equal(response.conversationId, 'conv_1');
    const records = requestBody?.records as Array<Record<string, unknown>>;
    assert.deepEqual(Object.keys(records[0]).sort(), ['activities', 'content', 'lifeDate', 'recordId']);
    assert.equal((records[0].activities as Array<Record<string, unknown>>)[0].topic, undefined);
    assert.match(requestHeaders?.get('X-Life-Wallet-Owner-Key') ?? '', /^[A-Za-z0-9_-]{8,64}$/);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('清除数据会同时请求删除后端 Agent 数据', async () => {
  const originalFetch = globalThis.fetch;
  let method = '';
  let ownerKey = '';
  globalThis.fetch = async (_input, init) => {
    method = init?.method ?? '';
    ownerKey = new Headers(init?.headers).get('X-Life-Wallet-Owner-Key') ?? '';
    return new Response(null, { status: 204 });
  };
  try {
    assert.equal(await clearUserData(), true);
    assert.equal(method, 'DELETE');
    assert.match(ownerKey, /^[A-Za-z0-9_-]{8,64}$/);
  } finally {
    globalThis.fetch = originalFetch;
  }
});
