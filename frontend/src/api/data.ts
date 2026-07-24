import { ApiError, apiFetch, existingOwnerKey, resetOwnerKey } from './client.ts';
import type { Account, FeedbackRating, GeneralFeedback, RecordFeedback, RecordPreview, TodayRecord } from '../mock/model.ts';

export type { Account, FeedbackRating, GeneralFeedback, RecordFeedback, RecordPreview, TodayRecord } from '../mock/model.ts';

type BackendRecord = Omit<TodayRecord, 'stateDescription'>;
const toRecord = (record: BackendRecord): TodayRecord => ({ ...record, stateDescription: '' });

export async function getAccount(): Promise<Account | null> {
  if (!existingOwnerKey()) return null;
  try {
    return await apiFetch<Account>('/api/account');
  } catch (error) {
    if (error instanceof ApiError && error.code === 'ACCOUNT_NOT_FOUND') return null;
    throw error;
  }
}

export function saveAccount(input: Pick<Account, 'birthday' | 'expectedLifeYears'>): Promise<Account> {
  return apiFetch('/api/account', { method: 'POST', body: JSON.stringify(input) });
}

export function previewRecord(input: Pick<TodayRecord, 'lifeDate' | 'content'>): Promise<RecordPreview> {
  return apiFetch('/api/agent/records/preview', { method: 'POST', body: JSON.stringify(input) });
}

export async function saveRecord(preview: RecordPreview, recordId: number | null = null): Promise<TodayRecord> {
  const record = await apiFetch<BackendRecord>('/api/agent/records/confirm', {
    method: 'POST', body: JSON.stringify({ ...preview, recordId }),
  });
  return toRecord(record);
}

export async function getRecentRecords(): Promise<TodayRecord[]> {
  if (!existingOwnerKey()) return [];
  return (await apiFetch<BackendRecord[]>('/api/life/recent-records')).map(toRecord);
}

export async function deleteRecord(recordId: number): Promise<TodayRecord[]> {
  await apiFetch<void>(`/api/agent/records/${recordId}`, { method: 'DELETE' });
  return getRecentRecords();
}

export async function getRecordFeedback(): Promise<RecordFeedback[]> {
  if (!existingOwnerKey()) return [];
  return apiFetch('/api/feedback/records');
}

export async function saveRecordFeedback(recordId: number, rating: FeedbackRating): Promise<RecordFeedback[]> {
  await apiFetch('/api/feedback/records', { method: 'POST', body: JSON.stringify({ recordId, rating }) });
  return getRecordFeedback();
}

export async function getGeneralFeedback(): Promise<GeneralFeedback[]> {
  if (!existingOwnerKey()) return [];
  return apiFetch('/api/feedback/experience');
}

export async function saveGeneralFeedback(content: string): Promise<GeneralFeedback[]> {
  await apiFetch('/api/feedback/experience', { method: 'POST', body: JSON.stringify({ content }) });
  return getGeneralFeedback();
}

export async function getExportData() {
  const [account, records, recordFeedback, generalFeedback] = await Promise.all([
    getAccount(), getRecentRecords(), getRecordFeedback(), getGeneralFeedback(),
  ]);
  return { exportedAt: new Date().toISOString(), account, records, recordFeedback, generalFeedback };
}

export async function clearUserData(): Promise<boolean> {
  if (!existingOwnerKey()) return true;
  try {
    await apiFetch<void>('/api/data', { method: 'DELETE' });
    resetOwnerKey();
    return true;
  } catch {
    return false;
  }
}
