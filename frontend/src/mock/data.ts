export type Account = {
  accountId: number;
  birthday: string;
  expectedLifeYears: number;
  totalLifeDays: number;
  usedLifeDays: number;
  remainingLifeDays: number;
};

export type AgentActivity = {
  title: string;
  durationMinutes: number;
  dimension: string;
  domain: string;
  topic: string;
  estimated: boolean;
};

export type DimensionSummary = {
  dimension: string;
  durationMinutes: number;
  lifeCoinAmount: number;
};

export type TodayRecord = {
  recordId: number;
  lifeDate: string;
  content: string;
  status: string;
  createdAt: string;
  intent: string;
  summary: string;
  activities: AgentActivity[];
  dimensionSummary: DimensionSummary[];
  needsConfirmation: boolean;
};

export type RecordPreview = Omit<TodayRecord, 'recordId' | 'status' | 'createdAt' | 'intent'> & {
  stateDescription: string;
};

const accountStorageKey = 'life-wallet-mock-account';
const recordStorageKey = 'life-wallet-mock-records';

// Mock 接口固定返回这份 JSON；无论输入内容是什么，都用它调试预览确认卡片。
const fixedAnalysis = {
  summary: '今天主要投入在工作和成长上。工作占据了大部分时间，也给英语练习留出了一点空间。',
  activities: [
    { title: '改 bug', durationMinutes: 480, dimension: '创造', domain: '工作', topic: '改 bug', estimated: true },
    { title: '英语口语练习', durationMinutes: 40, dimension: '成长', domain: '学习', topic: '英语口语练习', estimated: false },
  ] satisfies AgentActivity[],
  dimensionSummary: [
    { dimension: '创造', durationMinutes: 480, lifeCoinAmount: 0.92 },
    { dimension: '成长', durationMinutes: 40, lifeCoinAmount: 0.08 },
  ] satisfies DimensionSummary[],
  stateDescription: '有点累 · 中等消耗',
};

const defaultAccount: Account = {
  accountId: 1,
  birthday: '1995-01-01',
  expectedLifeYears: 80,
  totalLifeDays: 29220,
  usedLifeDays: 11490,
  remainingLifeDays: 17730,
};

export async function getMockAccount(): Promise<Account> {
  return readJson<Account>(accountStorageKey) ?? defaultAccount;
}

export async function saveMockAccount(input: Pick<Account, 'birthday' | 'expectedLifeYears'>): Promise<Account> {
  const birthday = new Date(`${input.birthday}T00:00:00`);
  const today = new Date();
  const expectedEnd = new Date(birthday);
  expectedEnd.setFullYear(expectedEnd.getFullYear() + input.expectedLifeYears);
  const day = 24 * 60 * 60 * 1000;
  const totalLifeDays = Math.max(0, Math.round((expectedEnd.getTime() - birthday.getTime()) / day));
  const usedLifeDays = Math.max(0, Math.floor((today.getTime() - birthday.getTime()) / day));
  const account: Account = {
    accountId: 1,
    birthday: input.birthday,
    expectedLifeYears: input.expectedLifeYears,
    totalLifeDays,
    usedLifeDays,
    remainingLifeDays: Math.max(0, totalLifeDays - usedLifeDays),
  };
  localStorage.setItem(accountStorageKey, JSON.stringify(account));
  return account;
}

export async function previewMockRecord(input: Pick<TodayRecord, 'lifeDate' | 'content'>): Promise<RecordPreview> {
  await new Promise((resolve) => window.setTimeout(resolve, 2000));
  return { lifeDate: input.lifeDate, content: input.content.trim(), ...fixedAnalysis, needsConfirmation: true };
}

export async function confirmMockRecord(preview: RecordPreview): Promise<TodayRecord> {
  const records = readJson<TodayRecord[]>(recordStorageKey) ?? [];
  const record: TodayRecord = { ...preview, recordId: Date.now(), status: 'ANALYZED', createdAt: new Date().toISOString(), intent: 'RECORD_TODAY' };
  localStorage.setItem(recordStorageKey, JSON.stringify([record, ...records.filter((item) => item.lifeDate !== record.lifeDate)]));
  return record;
}

export async function getMockTodayRecord(): Promise<TodayRecord | null> {
  const records = readJson<TodayRecord[]>(recordStorageKey) ?? [];
  return records.find((record) => record.lifeDate === todayValue()) ?? null;
}

export async function getMockRecentRecords(): Promise<TodayRecord[]> {
  return readJson<TodayRecord[]>(recordStorageKey) ?? [];
}

function readJson<T>(key: string): T | null {
  const raw = localStorage.getItem(key);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    localStorage.removeItem(key);
    return null;
  }
}

function todayValue() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}
