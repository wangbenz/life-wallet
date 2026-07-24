import assert from 'node:assert/strict';
import test from 'node:test';
import { resolveMockAgentIntent } from './agent.ts';
import type { TodayRecord } from './model.ts';

const record: TodayRecord = {
  recordId: 1,
  lifeDate: '2026-07-15',
  content: '今天上班 4 小时，晚上跑步 40 分钟',
  status: 'CONFIRMED',
  createdAt: '2026-07-15T10:00:00.000Z',
  intent: 'RECORD_LIFE',
  summary: '记录了创造和健康。',
  stateDescription: '',
  activities: [
    { title: '处理工作事项', durationMinutes: 240, dimension: '创造', domain: '工作', topic: '工作', estimated: false },
    { title: '跑步', durationMinutes: 40, dimension: '健康', domain: '身体', topic: '跑步', estimated: false },
  ],
  dimensionSummary: [],
  needsConfirmation: false,
};

test('Agent 能定位今天的工作并生成时长修改确认', () => {
  const intent = resolveMockAgentIntent('把今天的上班从 4 小时修改为 8 小时', [record], '2026-07-15');

  assert.equal(intent.kind, 'update-duration');
  if (intent.kind !== 'update-duration') return;
  assert.equal(intent.recordId, 1);
  assert.equal(intent.activityIndex, 0);
  assert.equal(intent.oldMinutes, 240);
  assert.equal(intent.newMinutes, 480);
});

test('Agent 删除前返回目标记录而不是直接执行', () => {
  const intent = resolveMockAgentIntent('删除今天的跑步记录', [record], '2026-07-15');

  assert.equal(intent.kind, 'delete-record');
  if (intent.kind !== 'delete-record') return;
  assert.equal(intent.recordId, 1);
});

test('Agent 查询只返回真实存在的今天记录', () => {
  const intent = resolveMockAgentIntent('我今天记了什么？', [record], '2026-07-15');

  assert.equal(intent.kind, 'list');
  if (intent.kind !== 'list') return;
  assert.deepEqual(intent.recordIds, [1]);
});

test('Agent 从历史卡片进入时只返回当前目标记录', () => {
  const anotherRecord = { ...record, recordId: 2, lifeDate: '2026-07-14' };
  const intent = resolveMockAgentIntent('查看这条记录', [record, anotherRecord], '2026-07-15', 2);

  assert.equal(intent.kind, 'list');
  if (intent.kind !== 'list') return;
  assert.deepEqual(intent.recordIds, [2]);
});

test('Agent 能把自然陈述识别为待确认的新记录', () => {
  const intent = resolveMockAgentIntent('今天上班 4 小时', [], '2026-07-15');

  assert.deepEqual(intent, { kind: 'create', content: '今天上班 4 小时' });
});
