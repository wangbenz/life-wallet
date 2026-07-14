import assert from 'node:assert/strict';
import test from 'node:test';
import { createMockAnalysis, summarizeDimensions } from './analysis.ts';

test('人生币按照 24 小时等于 1 元换算', () => {
  const summary = summarizeDimensions([
    { title: '工作', durationMinutes: 480, dimension: '创造', domain: '工作', topic: '工作', estimated: false },
    { title: '学习', durationMinutes: 40, dimension: '成长', domain: '学习', topic: '学习', estimated: false },
  ]);

  assert.equal(summary[0].lifeCoinAmount.toFixed(2), '0.33');
  assert.equal(summary[1].lifeCoinAmount.toFixed(2), '0.03');
});

test('Mock 根据自然语言识别多个生活维度和状态', () => {
  const result = createMockAnalysis('2026-07-14', '今天改 bug 8 小时，晚上练了 40 分钟英语口语，有点累');

  assert.deepEqual(result.activities.map((activity) => activity.dimension), ['创造', '成长']);
  assert.deepEqual(result.activities.map((activity) => activity.durationMinutes), [480, 40]);
  assert.equal(result.stateDescription, '有点累');
  assert.equal(result.needsConfirmation, false);
});

test('没有时长时明确标记为估算', () => {
  const result = createMockAnalysis('2026-07-14', '今天和朋友聊天，很开心');

  assert.equal(result.activities[0].dimension, '关系');
  assert.equal(result.activities[0].estimated, true);
  assert.equal(result.needsConfirmation, true);
});
