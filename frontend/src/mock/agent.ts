import type { TodayRecord } from './model.ts';

export type MockAgentIntent =
  | { kind: 'create'; content: string }
  | { kind: 'list'; message: string; recordIds: number[] }
  | {
    kind: 'update-duration';
    message: string;
    recordId: number;
    activityIndex: number;
    activityTitle: string;
    oldMinutes: number;
    newMinutes: number;
  }
  | { kind: 'delete-record'; message: string; recordId: number }
  | { kind: 'help'; message: string };

type ScoredActivity = {
  record: TodayRecord;
  activityIndex: number;
  score: number;
};

const activityGroups = [
  { triggers: ['上班', '工作', '加班', '代码', 'bug', '开会'], matches: ['创造', '工作', 'bug', '代码'] },
  { triggers: ['跑步', '运动', '健身', '散步'], matches: ['健康', '身体', '跑步', '运动'] },
  { triggers: ['学习', '英语', '阅读', '课程'], matches: ['成长', '学习', '英语', '阅读'] },
  { triggers: ['朋友', '家人', '聊天', '约会'], matches: ['关系', '朋友', '家人', '聊天'] },
  { triggers: ['睡觉', '睡眠', '午休'], matches: ['睡眠', '休息', '午休'] },
];

export function resolveMockAgentIntent(message: string, records: TodayRecord[], activeDate: string): MockAgentIntent {
  const content = message.trim();
  if (!content) return { kind: 'help', message: '先告诉我你想查询、记录还是修改哪段生活。' };

  if (/(删除|删掉|移除)/.test(content)) {
    const target = findBestActivity(content, records, activeDate);
    if (!target) {
      return { kind: 'help', message: '我还不能确定要删除哪条记录。可以补充日期或活动名称吗？' };
    }
    return {
      kind: 'delete-record',
      message: '我找到了可能对应的记录。删除会影响这条记录里的全部生活片段，请先确认。',
      recordId: target.record.recordId,
    };
  }

  if (/(修改|改成|改为|调整|变成|换成)/.test(content)) {
    const durations = extractDurations(content);
    if (durations.length === 0) {
      return { kind: 'help', message: '你希望把时长改成多少小时或多少分钟？' };
    }
    const target = findBestActivity(content, records, activeDate, durations[0]);
    if (!target) {
      return { kind: 'help', message: '我还不能确定要修改哪段活动。可以补充日期或活动名称吗？' };
    }
    const activity = target.record.activities[target.activityIndex];
    const newMinutes = durations[durations.length - 1];
    return {
      kind: 'update-duration',
      message: '我找到了对应活动。确认后只会修改这段活动的时长。',
      recordId: target.record.recordId,
      activityIndex: target.activityIndex,
      activityTitle: activity.title,
      oldMinutes: activity.durationMinutes,
      newMinutes,
    };
  }

  if (/(帮我记|记一下|记下|新增记录|记录一下)/.test(content)) {
    const recordContent = content.replace(/^(?:请|帮我)?\s*(?:记录一下|记一下|记下|帮我记|新增记录)[：:，,\s]*/, '').trim();
    if (!recordContent) return { kind: 'help', message: '可以继续说具体发生了什么，例如“记下今天跑步 40 分钟”。' };
    return { kind: 'create', content: recordContent };
  }

  if (extractDurations(content).length > 0 && /(今天|刚才|上午|下午|晚上|上班|工作|学习|跑步|运动|睡觉|通勤)/.test(content)) {
    return { kind: 'create', content };
  }

  if (/(记了什么|有哪些记录|查看记录|今天做了什么|最近的记录)/.test(content)) {
    const scopedRecords = content.includes('今天')
      ? records.filter((record) => record.lifeDate === activeDate)
      : records.slice(0, 3);
    if (scopedRecords.length === 0) {
      return { kind: 'list', message: content.includes('今天') ? '今天还没有已确认的记录。' : '最近还没有已确认的记录。', recordIds: [] };
    }
    return {
      kind: 'list',
      message: content.includes('今天')
        ? `今天有 ${scopedRecords.length} 条已确认记录。`
        : `这是最近的 ${scopedRecords.length} 条已确认记录。`,
      recordIds: scopedRecords.map((record) => record.recordId),
    };
  }

  return {
    kind: 'help',
    message: '我只处理 Life Wallet 里的生活记录。你可以让我查询今天、记下一段生活，或者修改和删除已确认记录。',
  };
}

function findBestActivity(message: string, records: TodayRecord[], activeDate: string, oldMinutes?: number): ScoredActivity | null {
  const scopedRecords = message.includes('今天')
    ? records.filter((record) => record.lifeDate === activeDate)
    : records;
  const scored: ScoredActivity[] = scopedRecords.flatMap((record) => record.activities.map((activity, activityIndex) => {
    const haystack = `${activity.title} ${activity.dimension} ${activity.domain} ${record.content}`.toLowerCase();
    let score = oldMinutes && activity.durationMinutes === oldMinutes ? 3 : 0;
    activityGroups.forEach((group) => {
      if (group.triggers.some((trigger) => message.toLowerCase().includes(trigger))) {
        score += group.matches.some((match) => haystack.includes(match.toLowerCase())) ? 5 : 0;
      }
    });
    if (message.includes(activity.title)) score += 8;
    return { record, activityIndex, score };
  }));

  scored.sort((a, b) => b.score - a.score);
  if (scored[0]?.score > 0) return scored[0];
  if (scopedRecords.length === 1 && scopedRecords[0].activities.length === 1) {
    return { record: scopedRecords[0], activityIndex: 0, score: 1 };
  }
  return null;
}

function extractDurations(message: string) {
  return [...message.matchAll(/(\d+(?:\.\d+)?)\s*(?:个)?\s*(小时|分钟)/g)]
    .map((match) => match[2] === '小时' ? Math.round(Number(match[1]) * 60) : Math.round(Number(match[1])));
}
