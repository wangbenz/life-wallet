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
  stateDescription: string;
  activities: AgentActivity[];
  dimensionSummary: DimensionSummary[];
  needsConfirmation: boolean;
};

export type RecordPreview = Omit<TodayRecord, 'recordId' | 'status' | 'createdAt' | 'intent'>;

export type FeedbackRating = 'accurate' | 'partial' | 'inaccurate';

export type RecordFeedback = {
  recordId: number;
  rating: FeedbackRating;
  createdAt: string;
};

export type GeneralFeedback = {
  feedbackId: number;
  content: string;
  createdAt: string;
};
