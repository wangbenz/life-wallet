import type { AgentActivity, DimensionSummary, RecordPreview } from './model.ts';

type ActivityRule = {
  keywords: string[];
  dimension: string;
  domain: string;
  fallbackMinutes: number;
  title: (content: string) => string;
};

const activityRules: ActivityRule[] = [
  {
    keywords: ['bug', '代码', '工作', '上班', '开会', '方案', '加班', '文档'],
    dimension: '创造',
    domain: '工作',
    fallbackMinutes: 480,
    title: (content) => content.toLowerCase().includes('bug')
      ? '处理工作中的 bug'
      : content.includes('上班')
        ? '上班'
        : '处理工作事项',
  },
  {
    keywords: ['学习', '英语', '口语', '读书', '课程', '练习'],
    dimension: '成长',
    domain: '学习',
    fallbackMinutes: 40,
    title: (content) => content.includes('英语') || content.includes('口语') ? '英语口语练习' : '学习与练习',
  },
  {
    keywords: ['运动', '跑步', '健身', '散步', '看病'],
    dimension: '健康',
    domain: '身体',
    fallbackMinutes: 45,
    title: (content) => content.includes('跑步') ? '跑步' : '照顾身体',
  },
  {
    keywords: ['朋友', '家人', '约会', '聊天', '陪伴'],
    dimension: '关系',
    domain: '关系',
    fallbackMinutes: 120,
    title: () => '与重要的人相处',
  },
  {
    keywords: ['做饭', '家务', '通勤', '收拾', '买菜'],
    dimension: '生活',
    domain: '日常',
    fallbackMinutes: 60,
    title: () => '处理日常生活',
  },
  {
    keywords: ['视频', '电影', '游戏', '逛街', '放松', '休闲'],
    dimension: '休闲',
    domain: '放松',
    fallbackMinutes: 120,
    title: (content) => content.includes('电影') ? '看电影' : '休闲放松',
  },
  {
    keywords: ['睡觉', '睡眠', '午休', '失眠', '熬夜'],
    dimension: '睡眠',
    domain: '休息',
    fallbackMinutes: 480,
    title: (content) => content.includes('午休') ? '午休' : '睡眠',
  },
];

export function createMockAnalysis(lifeDate: string, rawContent: string): RecordPreview {
  const content = rawContent.trim();
  const activities = activityRules
    .filter((rule) => rule.keywords.some((keyword) => content.toLowerCase().includes(keyword.toLowerCase())))
    .map((rule) => createActivity(content, rule));

  if (activities.length === 0) {
    activities.push({
      title: '今日生活片段',
      sourceText: content,
      durationMinutes: findFirstDuration(content) ?? 60,
      dimension: '生活',
      domain: '日常',
      topic: '生活记录',
      estimated: findFirstDuration(content) === null,
    });
  }

  const dimensionSummary = summarizeDimensions(activities);
  const stateDescription = extractState(content);

  return {
    lifeDate,
    content,
    summary: buildSummary(dimensionSummary, stateDescription),
    stateDescription,
    activities,
    dimensionSummary,
    needsConfirmation: activities.some((activity) => activity.estimated),
  };
}

export function summarizeDimensions(activities: AgentActivity[]): DimensionSummary[] {
  const totals = new Map<string, number>();
  activities.forEach((activity) => {
    totals.set(activity.dimension, (totals.get(activity.dimension) ?? 0) + activity.durationMinutes);
  });

  return [...totals.entries()]
    .map(([dimension, durationMinutes]) => ({
      dimension,
      durationMinutes,
    }))
    .sort((a, b) => b.durationMinutes - a.durationMinutes);
}

function createActivity(content: string, rule: ActivityRule): AgentActivity {
  const duration = findDurationNearKeywords(content, rule.keywords);
  return {
    title: rule.title(content),
    sourceText: findSourcePhraseNearKeywords(content, rule.keywords),
    durationMinutes: duration ?? rule.fallbackMinutes,
    dimension: rule.dimension,
    domain: rule.domain,
    topic: rule.title(content),
    estimated: duration === null,
  };
}

function findSourcePhraseNearKeywords(content: string, keywords: string[]) {
  const phrases = content
    .split(/[，。；;、\n]+/)
    .map((phrase) => phrase.trim())
    .filter(Boolean);
  return phrases.find((phrase) => keywords.some((keyword) => phrase.toLowerCase().includes(keyword.toLowerCase()))) ?? content;
}

function findDurationNearKeywords(content: string, keywords: string[]) {
  const lower = content.toLowerCase();
  const durations = [...content.matchAll(/(\d+(?:\.\d+)?)\s*(?:个)?\s*(小时|分钟)/g)]
    .map((match) => ({
      index: match.index,
      minutes: match[2] === '小时' ? Math.round(Number(match[1]) * 60) : Math.round(Number(match[1])),
    }));
  let closest: { distance: number; minutes: number } | null = null;

  for (const keyword of keywords) {
    const index = lower.indexOf(keyword.toLowerCase());
    if (index < 0) continue;
    for (const duration of durations) {
      const distance = Math.abs(duration.index - index);
      if (!closest || distance < closest.distance) closest = { distance, minutes: duration.minutes };
    }
  }
  return closest?.minutes ?? null;
}

function findFirstDuration(content: string) {
  const match = content.match(/(\d+(?:\.\d+)?)\s*(?:个)?\s*(小时|分钟)/);
  if (!match) return null;
  const value = Number(match[1]);
  return match[2] === '小时' ? Math.round(value * 60) : Math.round(value);
}

function extractState(content: string) {
  const states = ['有点累', '很累', '疲惫', '焦虑', '开心', '放松', '专注', '低落', '有成就感'];
  return states.find((state) => content.includes(state)) ?? (content.includes('累') ? '有点累' : '');
}

function buildSummary(summary: DimensionSummary[], stateDescription: string) {
  const [first, second] = summary;
  const stateCopy = stateDescription ? `你还提到自己${stateDescription}。` : '';
  if (!second) {
    return `从这段记录看，今天主要记录了${first.dimension}相关的生活片段。${stateCopy}`;
  }
  return `从这段记录看，投入较多的是${first.dimension}，同时也记录了${second.dimension}。${stateCopy}`;
}
