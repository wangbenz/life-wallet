import type { TodayRecord } from '../mock/model.ts';
import { getOwnerKey } from './client.ts';
import { createClientId } from './id.ts';

export type AgentApiPendingAction = {
  type: 'CREATE_RECORD' | 'UPDATE_DURATION' | 'DELETE_RECORD';
  recordId: number | null;
  activityIndex: number | null;
  activityTitle: string | null;
  oldMinutes: number | null;
  newMinutes: number | null;
  lifeDate: string | null;
  content: string | null;
};

export type AgentApiResponse = {
  conversationId: string;
  turnId: string;
  status: 'COMPLETED' | 'NEEDS_INPUT' | 'NEEDS_CONFIRMATION' | 'FAILED';
  message: string;
  recordIds: number[];
  pendingAction: AgentApiPendingAction | null;
};

type SendAgentMessageInput = {
  conversationId: string | null;
  message: string;
  lifeDate: string;
  contextRecordId: number | null;
  records: TodayRecord[];
};

export async function sendAgentMessage(input: SendAgentMessageInput): Promise<AgentApiResponse> {
  const controller = new AbortController();
  const timeout = globalThis.setTimeout(() => controller.abort(), 40_000);
  try {
    const response = await fetch('/api/agent/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Life-Wallet-Owner-Key': getOwnerKey(),
      },
      body: JSON.stringify({
        conversationId: input.conversationId,
        clientTurnId: createClientId(),
        message: input.message,
        lifeDate: input.lifeDate,
        contextRecordId: input.contextRecordId,
        records: input.records.slice(0, 20).map((record) => ({
          recordId: record.recordId,
          lifeDate: record.lifeDate,
          content: record.content,
          activities: record.activities.map((activity) => ({
            title: activity.title,
            durationMinutes: activity.durationMinutes,
            dimension: activity.dimension,
            domain: activity.domain,
          })),
        })),
      }),
      signal: controller.signal,
    });
    const body = await response.json().catch(() => null) as AgentApiResponse | { message?: string } | null;
    if (!response.ok) {
      throw new Error(body && 'message' in body && body.message
        ? body.message
        : 'Life Agent 暂时不可用，请稍后再试。');
    }
    return body as AgentApiResponse;
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new Error('Life Agent 响应超时，请稍后再试。');
    }
    throw error;
  } finally {
    globalThis.clearTimeout(timeout);
  }
}
