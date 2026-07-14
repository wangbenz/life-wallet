import { createMockAnalysis, summarizeDimensions } from './analysis.ts';
import type {
  Account,
  FeedbackRating,
  GeneralFeedback,
  RecordFeedback,
  RecordPreview,
  TodayRecord,
} from './model.ts';

export type {
  Account,
  AgentActivity,
  DimensionSummary,
  FeedbackRating,
  GeneralFeedback,
  RecordFeedback,
  RecordPreview,
  TodayRecord,
} from './model.ts';

const accountStorageKey = 'life-wallet-mock-account';
const legacyAccountStorageKey = 'life-wallet-account';
const recordStorageKey = 'life-wallet-mock-records';
const recordFeedbackStorageKey = 'life-wallet-mock-record-feedback';
const generalFeedbackStorageKey = 'life-wallet-mock-general-feedback';

export async function getMockAccount(): Promise<Account | null> {
  const account = readJson<Account>(accountStorageKey);
  if (account) return account;

  // 兼容早期原型使用的账户 key，迁移后只由 Mock 数据层维护一份账户状态。
  const legacyAccount = readJson<Account>(legacyAccountStorageKey);
  if (legacyAccount) {
    localStorage.setItem(accountStorageKey, JSON.stringify(legacyAccount));
    return legacyAccount;
  }
  return null;
}

export async function saveMockAccount(input: Pick<Account, 'birthday' | 'expectedLifeYears'>): Promise<Account> {
  const birthday = new Date(`${input.birthday}T00:00:00`);
  const today = new Date();
  if (Number.isNaN(birthday.getTime()) || birthday > today) {
    throw new Error('请输入有效且不晚于今天的出生日期。');
  }

  const currentAge = today.getFullYear() - birthday.getFullYear();
  if (input.expectedLifeYears <= currentAge || input.expectedLifeYears > 120) {
    throw new Error('预期寿命需要大于当前年龄，且不超过 120 岁。');
  }

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
  if (!input.content.trim()) throw new Error('先说说这一天发生了什么。');
  await new Promise((resolve) => window.setTimeout(resolve, 900));
  return createMockAnalysis(input.lifeDate, input.content);
}

export async function saveMockRecord(preview: RecordPreview, existingRecordId: number | null = null): Promise<TodayRecord> {
  const records = readJson<TodayRecord[]>(recordStorageKey) ?? [];
  const record: TodayRecord = {
    ...preview,
    recordId: existingRecordId ?? Date.now(),
    status: 'CONFIRMED',
    createdAt: new Date().toISOString(),
    intent: existingRecordId ? 'UPDATE_RECORD' : 'RECORD_LIFE',
  };
  localStorage.setItem(recordStorageKey, JSON.stringify([
    record,
    ...records.filter((item) => item.recordId !== existingRecordId),
  ]));
  return record;
}

export async function getMockRecentRecords(): Promise<TodayRecord[]> {
  return (readJson<TodayRecord[]>(recordStorageKey) ?? [])
    .map((record) => ({
      ...record,
      stateDescription: record.stateDescription ?? '',
      dimensionSummary: summarizeDimensions(record.activities),
    }))
    .sort((a, b) => b.lifeDate.localeCompare(a.lifeDate) || b.createdAt.localeCompare(a.createdAt));
}

export async function deleteMockRecord(recordId: number): Promise<TodayRecord[]> {
  const records = (readJson<TodayRecord[]>(recordStorageKey) ?? []).filter((record) => record.recordId !== recordId);
  const feedback = (readJson<RecordFeedback[]>(recordFeedbackStorageKey) ?? []).filter((item) => item.recordId !== recordId);
  localStorage.setItem(recordStorageKey, JSON.stringify(records));
  localStorage.setItem(recordFeedbackStorageKey, JSON.stringify(feedback));
  return records;
}

export async function getMockRecordFeedback(): Promise<RecordFeedback[]> {
  return readJson<RecordFeedback[]>(recordFeedbackStorageKey) ?? [];
}

export async function saveMockRecordFeedback(recordId: number, rating: FeedbackRating): Promise<RecordFeedback[]> {
  const feedback = readJson<RecordFeedback[]>(recordFeedbackStorageKey) ?? [];
  const next = [
    { recordId, rating, createdAt: new Date().toISOString() },
    ...feedback.filter((item) => item.recordId !== recordId),
  ];
  localStorage.setItem(recordFeedbackStorageKey, JSON.stringify(next));
  return next;
}

export async function getMockGeneralFeedback(): Promise<GeneralFeedback[]> {
  return readJson<GeneralFeedback[]>(generalFeedbackStorageKey) ?? [];
}

export async function saveMockGeneralFeedback(content: string): Promise<GeneralFeedback[]> {
  if (!content.trim()) throw new Error('请先写下你的使用感受。');
  const feedback = readJson<GeneralFeedback[]>(generalFeedbackStorageKey) ?? [];
  const next = [{ feedbackId: Date.now(), content: content.trim(), createdAt: new Date().toISOString() }, ...feedback];
  localStorage.setItem(generalFeedbackStorageKey, JSON.stringify(next));
  return next;
}

export async function clearMockUserData(): Promise<void> {
  [accountStorageKey, legacyAccountStorageKey, recordStorageKey, recordFeedbackStorageKey, generalFeedbackStorageKey]
    .forEach((key) => localStorage.removeItem(key));
}

export async function getMockExportData() {
  return {
    exportedAt: new Date().toISOString(),
    account: await getMockAccount(),
    records: await getMockRecentRecords(),
    recordFeedback: await getMockRecordFeedback(),
    generalFeedback: await getMockGeneralFeedback(),
  };
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
