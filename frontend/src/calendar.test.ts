import assert from 'node:assert/strict';
import test from 'node:test';
import { getCalendarMonth, getYearPageStart, parseIsoDate, toIsoDate } from './calendar.ts';

test('日历按周一开头并正确生成月份日期', () => {
  const january = getCalendarMonth(1995, 0, '1995-01-31');
  assert.equal(january.firstWeekday, 6);
  assert.equal(january.days.length, 31);
  assert.deepEqual(january.days[0], { day: 1, value: '1995-01-01', disabled: false });
});

test('日历禁用最大日期之后的未来日期', () => {
  const july = getCalendarMonth(2026, 6, '2026-07-23');
  assert.equal(july.days[22].disabled, false);
  assert.equal(july.days[23].disabled, true);
});

test('日期格式和年份分页保持稳定', () => {
  assert.deepEqual(parseIsoDate('1999-07-15'), { year: 1999, month: 6, day: 15 });
  assert.equal(toIsoDate(1999, 6, 5), '1999-07-05');
  assert.equal(getYearPageStart(1999), 1992);
});
