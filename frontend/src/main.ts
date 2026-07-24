import './styles.css';
import {
  ArrowLeft,
  ArrowUp,
  CalendarDays,
  ChartNoAxesColumnIncreasing,
  ChevronRight,
  CircleCheck,
  Clock3,
  DatabaseBackup,
  Download,
  HeartHandshake,
  House,
  Info,
  MessageCircleHeart,
  MessageCircleQuestion,
  MoreHorizontal,
  NotebookTabs,
  PencilLine,
  Settings2,
  ShieldCheck,
  Sparkles,
  Sprout,
  Trash2,
  UserRound,
  WalletCards,
  createElement as createLucideElement,
  type IconNode,
} from 'lucide';
import { summarizeDimensions } from './mock/analysis.ts';
import { resolveMockAgentIntent } from './mock/agent.ts';
import { getCalendarMonth, getYearPageStart, parseIsoDate, toIsoDate } from './calendar.ts';
import {
  clearMockUserData,
  deleteMockRecord,
  getMockAccount,
  getMockExportData,
  getMockGeneralFeedback,
  getMockRecentRecords,
  getMockRecordFeedback,
  previewMockRecord,
  saveMockAccount,
  saveMockGeneralFeedback,
  saveMockRecord,
  saveMockRecordFeedback,
  type Account,
  type FeedbackRating,
  type GeneralFeedback,
  type RecordFeedback,
  type RecordPreview,
  type TodayRecord,
} from './mock/data.ts';

type Tab = 'today' | 'life' | 'me';
type LifeView = 'insights' | 'records';
type CalendarTarget = 'record' | 'birthday';
type CalendarView = 'days' | 'months' | 'years';
type IconName = 'back' | 'home' | 'life' | 'user' | 'info' | 'agent' | 'send' | 'calendar' | 'edit' | 'shield' | 'database' | 'help' | 'download' | 'trash' | 'check' | 'sparkles' | 'clock' | 'heart' | 'chevron' | 'insights' | 'records' | 'settings' | 'wallet' | 'more';
type AgentMessage = { id: number; role: 'agent' | 'user'; content: string; recordIds?: number[] };
type AgentPendingAction =
  | { type: 'create-record'; preview: RecordPreview }
  | { type: 'update-duration'; recordId: number; activityIndex: number; activityTitle: string; oldMinutes: number; newMinutes: number }
  | { type: 'delete-record'; recordId: number };

const app = document.querySelector<HTMLDivElement>('#app');
if (!app) throw new Error('App root element not found');
const appRoot = app;

let activeTab: Tab = 'today';
let activeLifeView: LifeView = 'insights';
let isAgentOpen = false;
let isAccountOnboarding = false;
let agentOriginTab: Tab = 'today';
let account: Account | null = null;
let recentRecords: TodayRecord[] = [];
let recordFeedback: RecordFeedback[] = [];
let generalFeedback: GeneralFeedback[] = [];
let recordPreview: RecordPreview | null = null;
let editingRecordId: number | null = null;
let pendingDeleteRecordId: number | null = null;
let openRecordMenuId: number | null = null;
let expandedRecordId: number | null = null;
let isAnalyzingRecord = false;
let isWorldviewExpanded = false;
let isLoading = true;
let isClearDataConfirming = false;
let isAccountDirty = false;
let formMessage = '';
let recordMessage = '';
let feedbackMessage = '';
let isFeedbackExpanded = false;
let recordDraft = '';
let recordLifeDate = todayValue();
let accountBirthdayDraft: string | null = null;
let accountExpectedLifeYearsDraft: number | null = null;
let calendarTarget: CalendarTarget | null = null;
let calendarView: CalendarView = 'days';
let calendarYear = new Date().getFullYear();
let calendarMonth = new Date().getMonth();
let agentDraft = '';
let isAgentThinking = false;
let agentPendingAction: AgentPendingAction | null = null;
let agentContextRecordId: number | null = null;
let agentMessages: AgentMessage[] = [
  { id: 1, role: 'agent', content: '你好，我是 Life Agent。你可以让我查询、记录或修改生活片段；写操作会先请你确认。' },
];

function render() {
  const isFocusedFlow = isAgentOpen || isAccountOnboarding || (!account && activeTab === 'today');
  appRoot.innerHTML = `
    <main class="app-shell${isAgentOpen ? ' agent-shell' : ''}${isAccountOnboarding ? ' onboarding-flow-shell' : ''}">
      <div class="content-scroll">
        ${isLoading ? renderLoading() : (isAgentOpen ? renderAgentScreen() : isAccountOnboarding ? renderAccountOnboarding() : `${renderToday()}${renderLife()}${renderMe()}`)}
      </div>
      ${isFocusedFlow ? '' : `<nav class="tab-bar" aria-label="主导航">
        ${renderTabButton('today', 'home', '今天')}
        ${renderTabButton('life', 'life', '人生')}
        ${renderTabButton('me', 'user', '我的')}
      </nav>`}
    </main>
    ${calendarTarget ? renderCalendarDialog() : ''}
  `;
  bindEvents();
}

function renderLoading() {
  return '<section class="loading-screen"><span></span><p>正在读取你的人生记录...</p></section>';
}

function renderTabButton(tab: Tab, icon: IconName, label: string) {
  return `<button type="button" data-tab="${tab}" class="${activeTab === tab ? 'active' : ''}" aria-current="${activeTab === tab ? 'page' : 'false'}"><span class="tab-icon">${renderIcon(icon)}</span><span>${label}</span></button>`;
}

function renderToday() {
  if (activeTab !== 'today') return '';
  if (!account) return renderTodayOnboarding();

  const dayRecords = recentRecords.filter((record) => record.lifeDate === recordLifeDate);
  const todayLabel = formatHeaderDate(new Date());

  return `
    <section class="screen today-screen">
      <header class="today-header">
        <time datetime="${todayValue()}">${todayLabel}</time>
        <button class="agent-entry" type="button" data-open-agent aria-label="打开 Life Agent 对话">
          ${renderIcon('agent')}
          <span>Life Agent</span>
        </button>
      </header>

      <section class="life-balance-strip">
        <div class="balance-main">
          <span class="balance-mark">${renderIcon('life')}</span>
          <div><p>预计剩余</p><strong>${formatNumber(account.remainingLifeDays)}<em> 天</em></strong></div>
          <button class="icon-button" type="button" data-worldview-toggle aria-expanded="${isWorldviewExpanded}" aria-label="了解剩余天数估算">${renderIcon('info')}</button>
        </div>
        <div class="daily-cost"><span>${renderIcon('clock')}</span><p>今天拥有<strong>24 小时</strong></p></div>
        ${isWorldviewExpanded ? '<p class="worldview-explanation">剩余天数根据出生日期和预期寿命估算，仅作为时间参考。记录不是为了补齐每一分钟，而是帮助你看见那些值得回看的生活片段。</p>' : ''}
      </section>

      <section class="record-hero">
        <div class="record-hero-copy">
          <h1>${dayRecords.length > 0 ? '今天，还有哪些片段值得记住？' : '今天，哪些片段值得记住？'}</h1>
          <p>写下一段生活，我会整理出活动、时长和感受；确认后会进入你的人生洞察。</p>
        </div>
        ${renderComposer()}
        <div class="quick-record" aria-label="表达提示">
          <button type="button" data-quick-prompt="上午开会 2 小时，下午专注写方案 3 小时">${renderIcon('sparkles')}工作片段示例</button>
          <button type="button" data-quick-prompt="晚上跑步 40 分钟，回家读书半小时">${renderIcon('clock')}生活片段示例</button>
          <button type="button" data-quick-prompt="今天有点疲惫，但完成后很踏实">${renderIcon('heart')}感受表达示例</button>
        </div>
        ${recentRecords.length === 0 ? `
          <aside class="agent-guide">
            <span aria-hidden="true">${renderIcon('agent')}</span>
            <p>记录保存后，可以用右上角 Life Agent 查询或修改；任何写入都会先请你确认。</p>
          </aside>
        ` : ''}
      </section>

      ${renderSubmittedRecordBubble()}
      ${isAnalyzingRecord ? renderAgentMessage('我正在整理这段记录。完成后请你确认活动和估算时长是否准确。') : ''}
      ${renderRecordPreview()}
      ${renderDayRecords(dayRecords)}
    </section>
  `;
}

function renderTodayOnboarding() {
  return `
    <section class="screen today-screen onboarding-screen">
      <section class="onboarding-card">
        <span class="onboarding-mark">1</span>
        <p class="eyebrow">欢迎来到 Life Wallet</p>
        <h1>把每天的生活，记成看得懂的人生账单</h1>
        <p>用一句话记录工作、生活和感受，再确认系统整理出的内容，慢慢看见时间花去了哪里。数据仅保存在当前浏览器。</p>
        <ol class="onboarding-value-path" aria-label="Life Wallet 使用流程">
          <li>记录一句生活</li>
          <li>确认整理结果</li>
          <li>看见长期变化</li>
        </ol>
        <button type="button" class="primary-action" data-start-account>估算剩余天数</button>
      </section>
    </section>
  `;
}

function renderAccountOnboarding() {
  const birthday = accountBirthdayDraft ?? '';
  const expectedLifeYears = accountExpectedLifeYearsDraft ?? 80;
  return `
    <section class="screen account-onboarding-screen">
      <header class="focused-flow-header">
        <button type="button" data-cancel-onboarding aria-label="返回欢迎页">${renderIcon('back')}</button>
        <span>设置时间估算</span>
      </header>
      <section class="account-onboarding-copy">
        <span class="onboarding-mark">1</span>
        <p class="eyebrow">以天为时间尺度</p>
        <h1>看看你预计还拥有多少天</h1>
        <p>生日和预期寿命只用于估算剩余天数，之后都可以修改。当前 Demo 不联网，数据仅保存在这个浏览器。</p>
      </section>
      <section class="settings-section account-settings settings-group onboarding-account-card">
        ${renderAccountForm(birthday, expectedLifeYears, true)}
      </section>
    </section>
  `;
}

function renderSubmittedRecordBubble() {
  if ((!isAnalyzingRecord && !recordPreview) || !recordDraft) return '';
  return `<section class="user-bubble"><p>${escapeHtml(recordDraft)}</p></section>`;
}

function renderAgentMessage(message: string) {
  return `
    <section class="agent-panel processing-message">
      <div class="agent-avatar" aria-hidden="true">${renderIcon('agent')}</div>
      <div class="agent-bubble muted"><p>${message}</p><span class="thinking-dots"><i></i><i></i><i></i></span></div>
    </section>
  `;
}

function renderRecordPreview() {
  const preview = recordPreview;
  if (!preview) return '';
  const recordedMinutes = preview.dimensionSummary.reduce((sum, item) => sum + item.durationMinutes, 0);
  const sourcePhrases = splitSourcePhrases(preview.content);
  const mayHaveOmissions = sourcePhrases.length > preview.activities.length;

  return `
    <section class="record-preview" data-record-preview tabindex="-1">
      <div class="card-heading">
        <div><p class="eyebrow">AI 理解预览</p><h2>请确认这段理解</h2></div>
        <span>${formatLifeDate(preview.lifeDate)}</span>
      </div>
      <div class="preview-activities">
        ${preview.activities.map((activity, index) => `
          <article>
            <span>${escapeHtml(activity.dimension)} · ${escapeHtml(activity.domain)}${activity.estimated ? ' · 估算' : ''}</span>
            <p class="activity-source"><span>来自原文</span>“${escapeHtml(activity.sourceText ?? sourcePhrases[index] ?? preview.content)}”</p>
            <label>活动<input data-preview-title="${index}" value="${escapeHtml(activity.title)}" aria-label="第 ${index + 1} 条活动名称" /></label>
            <label>时长<span class="duration-input"><input data-preview-duration="${index}" type="number" min="1" max="1440" value="${activity.durationMinutes}" aria-label="第 ${index + 1} 条活动时长" /><em>分钟</em></span></label>
          </article>
        `).join('')}
      </div>
      ${mayHaveOmissions ? `<p class="preview-warning">${renderIcon('info')} 原文有 ${sourcePhrases.length} 个表达片段，当前整理出 ${preview.activities.length} 项。请检查是否有内容被遗漏。</p>` : ''}
      ${preview.stateDescription ? `<p class="state-line"><strong>你提到：</strong>${escapeHtml(preview.stateDescription)}</p>` : ''}
      <div class="preview-summary">
        <span>AI 今日总结</span>
        <p>${escapeHtml(preview.summary)}</p>
      </div>
      <p class="duration-note">这些片段共记录 <strong>${formatDuration(recordedMinutes)}</strong>；不要求补齐全天。</p>
      <div class="preview-actions">
        <p>以上理解是否准确？</p>
        <button type="button" class="secondary-action" data-preview-action="modify">修改原文</button>
        <button type="button" class="primary-action compact" data-preview-action="confirm">确认并保存</button>
      </div>
    </section>
  `;
}

function splitSourcePhrases(content: string) {
  return content
    .split(/[，。；;、\n]+/)
    .map((phrase) => phrase.trim())
    .filter((phrase) => phrase.length >= 2);
}

function renderDayRecords(records: TodayRecord[]) {
  if (records.length === 0) return '';
  return `
    <section class="today-fragments">
      <div class="fragments-heading"><h2>${recordLifeDate === todayValue() ? '今天的片段' : `${formatLifeDate(recordLifeDate)}的片段`}</h2><span>${records.length} 条</span></div>
      <div class="fragment-list">
        ${records.map((record) => `
          <article class="fragment-row${expandedRecordId === record.recordId ? ' expanded' : ''}">
            <div class="fragment-summary">
              <time>${formatClockTime(record.createdAt)}</time>
              <p>${escapeHtml(record.content)}</p>
              <button type="button" data-record-detail="${record.recordId}" aria-expanded="${expandedRecordId === record.recordId}">${expandedRecordId === record.recordId ? '收起理解' : '查看理解'} ${renderIcon('chevron')}</button>
            </div>
            ${expandedRecordId === record.recordId ? renderSavedRecord(record) : ''}
          </article>
        `).join('')}
      </div>
    </section>
  `;
}

function renderSavedRecord(record: TodayRecord) {
  const feedback = recordFeedback.find((item) => item.recordId === record.recordId)?.rating;
  const totalMinutes = record.dimensionSummary.reduce((sum, item) => sum + item.durationMinutes, 0);
  return `
    <article class="saved-record-card">
      <div class="saved-source"><p>${escapeHtml(record.content)}</p><div class="saved-actions"><button type="button" data-agent-record="${record.recordId}">${renderIcon('agent')} Agent 修改</button><button type="button" data-edit-record="${record.recordId}">${renderIcon('edit')} 手动修正</button></div></div>
      <div class="analysis-heading">
        <div class="agent-avatar small" aria-hidden="true">${renderIcon('agent')}</div>
        <div><p class="eyebrow">我理解的是</p><p>${escapeHtml(record.summary)}</p></div>
      </div>
      <div class="dimension-list">
        ${record.dimensionSummary.map((item) => `<div><span>${escapeHtml(item.dimension)}</span><strong>${formatDuration(item.durationMinutes)}</strong></div>`).join('')}
      </div>
      <div class="activity-list">
        ${record.activities.map((activity) => `<article><div><strong>${escapeHtml(activity.title)}</strong><span>${escapeHtml(activity.dimension)} · ${escapeHtml(activity.domain)}</span></div><p>${formatDuration(activity.durationMinutes)}${activity.estimated ? ' · 估算' : ''}</p></article>`).join('')}
      </div>
      <p class="duration-note">本次共记录 <strong>${formatDuration(totalMinutes)}</strong>。</p>
      <div class="record-feedback">
        <p>${feedback ? '感谢反馈，这会帮助我们改进理解方式。' : '这个理解像你的一天吗？'}</p>
        <div>
          ${renderFeedbackButton(record.recordId, 'accurate', '准确', feedback)}
          ${renderFeedbackButton(record.recordId, 'partial', '部分准确', feedback)}
          ${renderFeedbackButton(record.recordId, 'inaccurate', '不准确', feedback)}
        </div>
      </div>
    </article>
  `;
}

function renderFeedbackButton(recordId: number, rating: FeedbackRating, label: string, selected?: FeedbackRating) {
  return `<button type="button" data-record-feedback="${recordId}" data-rating="${rating}" class="${selected === rating ? 'selected' : ''}" aria-pressed="${selected === rating}">${label}</button>`;
}

function renderComposer() {
  return `
    <form class="composer" id="record-form">
      <label class="record-date"><span>记录日期</span><input name="lifeDate" type="hidden" value="${recordLifeDate}" /><button class="date-trigger compact" type="button" data-open-calendar="record" aria-label="选择记录日期，当前为 ${formatCalendarTriggerDate(recordLifeDate)}">${renderIcon('calendar')}<span>${formatCalendarTriggerDate(recordLifeDate)}</span>${renderIcon('chevron')}</button></label>
      <textarea name="content" maxlength="2000" rows="4" placeholder="例如：下午专注改了 3 小时 bug，晚上跑步 40 分钟…" required>${escapeHtml(recordDraft)}</textarea>
      <button type="submit" aria-label="整理这段记录" ${isAnalyzingRecord ? 'disabled' : ''}>${renderIcon('sparkles')}<span>${isAnalyzingRecord ? '正在整理…' : '整理这段记录'}</span></button>
      <p>${escapeHtml(recordMessage)}</p>
    </form>
  `;
}

function renderLife() {
  if (activeTab !== 'life') return '';
  return `
    <section class="screen life-screen">
      <header class="page-heading life-heading">
        <div class="page-heading-row">
          <div><p class="page-kicker">${renderIcon('life')} Life Review</p><h1>人生</h1><p>从真实记录里，看见时间正在流向哪里。</p></div>
          <span class="heading-symbol" aria-hidden="true">${renderIcon('insights')}</span>
        </div>
        <div class="segmented" aria-label="人生视图">
          <button type="button" data-life-view="insights" class="${activeLifeView === 'insights' ? 'active' : ''}" aria-pressed="${activeLifeView === 'insights'}">${renderIcon('insights')} 洞察</button>
          <button type="button" data-life-view="records" class="${activeLifeView === 'records' ? 'active' : ''}" aria-pressed="${activeLifeView === 'records'}">${renderIcon('records')} 记录</button>
        </div>
      </header>
      ${activeLifeView === 'insights' ? renderLifeInsights() : renderLifeRecords()}
    </section>
  `;
}

function renderLifeInsights() {
  const recordDates = [...new Set(recentRecords.map((record) => record.lifeDate))];
  if (recordDates.length === 0) {
    return renderEmptyState('还没有足够的生活记录', '完成第一条记录后，这里会开始形成只属于你的回看。', '去记录今天', 'today');
  }

  const selectedDates = recordDates.slice(0, 7);
  const selectedRecords = recentRecords.filter((record) => selectedDates.includes(record.lifeDate));
  const dimensions = summarizeDimensions(selectedRecords.flatMap((record) => record.activities));
  const totalMinutes = dimensions.reduce((sum, item) => sum + item.durationMinutes, 0);
  const progress = Math.min(100, (recordDates.length / 7) * 100);
  const top = dimensions[0];
  const second = dimensions[1];
  const isEarlySample = recordDates.length < 3;

  return `
    <section class="life-view-panel">
      <section class="life-overview-card">
        <header><span class="section-icon">${renderIcon('insights')}</span><div><p class="eyebrow">${selectedDates.length >= 7 ? '最近 7 个记录日' : '当前记录样本'}</p><h2>${recordDates.length >= 3 ? '生活正在有迹可循' : '先收集真实片段'}</h2></div></header>
        <div class="life-metric-grid">
          <div><span>记录日</span><strong>${recordDates.length}<em>天</em></strong><small>不要求连续</small></div>
          <div><span>生活片段</span><strong>${selectedRecords.length}<em>条</em></strong><small>仅已确认</small></div>
          <div><span>已记录时长</span><strong class="duration-value">${formatDuration(totalMinutes)}</strong><small>仅统计片段</small></div>
        </div>
        <div class="review-progress">
          <div><span>第一份阶段回看</span><strong>${recordDates.length >= 7 ? '已达到样本量' : `还差 ${7 - recordDates.length} 个记录日`}</strong></div>
          <div class="progress-track" aria-label="阶段回看进度 ${Math.round(progress)}%"><i style="width:${progress}%"></i></div>
        </div>
      </section>

      ${recordDates.length < 3 ? `
        <section class="insight-card gentle life-agent-note">
          <span class="agent-avatar small">${renderIcon('agent')}</span>
          <div><p class="eyebrow">Life Agent 的观察</p><h2>现在更适合记录，不急着定义</h2><p>已经留下 ${recordDates.length} 个记录日。至少积累 3 个记录日后，我再开始比较变化，避免用太少的数据定义你的生活。</p></div>
        </section>
      ` : `
        <section class="insight-card life-agent-note">
          <span class="agent-avatar small">${renderIcon('agent')}</span>
          <div><p class="eyebrow">Life Agent 的观察</p><h2>${escapeHtml(top.dimension)}是已记录片段里最多的维度</h2><p>最近 ${selectedDates.length} 个记录日里，${escapeHtml(top.dimension)}约 ${formatDuration(top.durationMinutes)}${second ? `，其次是${escapeHtml(second.dimension)}约 ${formatDuration(second.durationMinutes)}` : ''}。它只反映你主动留下的片段，不代表完整的 24 小时。</p></div>
        </section>
      `}

      <section class="distribution-card">
        <div class="card-heading"><div class="section-heading-copy"><span class="section-icon pale">${renderIcon('records')}</span><div><p class="eyebrow">已记录时间分布</p><h2>${selectedDates.length} 个记录日</h2></div></div><span>共 ${formatDuration(totalMinutes)}</span></div>
        <div class="distribution-list">
          ${dimensions.map((item) => {
            const percent = totalMinutes > 0 ? Math.round((item.durationMinutes / totalMinutes) * 100) : 0;
            return `<div><header><span>${escapeHtml(item.dimension)}</span><strong>${isEarlySample ? formatDuration(item.durationMinutes) : `${percent}%`}</strong></header><div><i style="width:${percent}%"></i></div><small>${formatDuration(item.durationMinutes)} · 仅统计已确认片段</small></div>`;
          }).join('')}
        </div>
        <p class="data-scope-note">${renderIcon('info')} 这里只计算你确认过的记录，不补全未记录时间。</p>
      </section>

      <button type="button" class="text-action life-records-action" data-life-view="records"><span>${renderIcon('records')} 查看全部历史记录</span>${renderIcon('chevron')}</button>
    </section>
  `;
}

function renderLifeRecords() {
  if (recentRecords.length === 0) {
    return renderEmptyState('这里会保存你的生活片段', '记录不需要连续，也不需要补齐全天。', '去记录第一条', 'today');
  }

  const recordDays = new Set(recentRecords.map((record) => record.lifeDate)).size;
  const totalMinutes = recentRecords.flatMap((record) => record.activities).reduce((sum, activity) => sum + activity.durationMinutes, 0);

  return `
    <section class="life-view-panel history-panel">
      <section class="records-overview">
        <div><span class="section-icon">${renderIcon('records')}</span><div><p class="eyebrow">全部真实记录</p><h2>${recordDays} 个记录日</h2></div></div>
        <div><span>${recentRecords.length} 条记录</span><strong>${formatDuration(totalMinutes)}</strong></div>
      </section>
      <div class="history-list">
        ${recentRecords.map((record) => `
          <article class="history-card">
            <header><time>${formatLifeDate(record.lifeDate)}</time><span>${renderIcon('records')} ${record.activities.length} 个片段</span></header>
            <p class="history-source">${escapeHtml(record.content)}</p>
            <p class="history-summary">${escapeHtml(record.summary)}</p>
            <div class="history-tags">${record.dimensionSummary.map((item) => `<span>${escapeHtml(item.dimension)} · ${formatDuration(item.durationMinutes)}</span>`).join('')}</div>
            <footer>
              <button type="button" class="history-agent-action" data-agent-record="${record.recordId}">${renderIcon('agent')} 用 Agent 修改</button>
              <div class="record-more">
                <button type="button" data-record-menu="${record.recordId}" aria-expanded="${openRecordMenuId === record.recordId}" aria-label="更多记录操作">${renderIcon('more')} 更多</button>
                ${openRecordMenuId === record.recordId ? `<div class="record-more-menu">
                  <button type="button" data-edit-record="${record.recordId}">${renderIcon('edit')} 手动修正</button>
                  ${pendingDeleteRecordId === record.recordId
                    ? `<p>确定删除这条记录？</p><button type="button" class="danger" data-delete-record="${record.recordId}" data-delete-action="confirm">确认删除</button><button type="button" data-delete-record="${record.recordId}" data-delete-action="cancel">取消</button>`
                    : `<button type="button" class="danger-text" data-delete-record="${record.recordId}" data-delete-action="ask">${renderIcon('trash')} 删除记录</button>`}
                </div>` : ''}
              </div>
            </footer>
          </article>
        `).join('')}
      </div>
    </section>
  `;
}

function renderEmptyState(title: string, description: string, action: string, tab: Tab) {
  return `<section class="empty-state"><span>${renderIcon('life')}</span><h2>${title}</h2><p>${description}</p><button type="button" class="primary-action" data-tab="${tab}">${action}</button></section>`;
}

function renderMe() {
  if (activeTab !== 'me') return '';
  const birthday = accountBirthdayDraft ?? account?.birthday ?? '';
  const expectedLifeYears = accountExpectedLifeYearsDraft ?? account?.expectedLifeYears ?? 80;
  const recordDays = new Set(recentRecords.map((record) => record.lifeDate)).size;
  const recordedMinutes = recentRecords.flatMap((record) => record.activities).reduce((sum, activity) => sum + activity.durationMinutes, 0);

  return `
    <section class="screen me-screen">
      <header class="page-heading me-heading">
        <div class="page-heading-row">
          <div><p class="page-kicker">${renderIcon('settings')} My Space</p><h1>我的</h1><p>管理账户依据、隐私和保存在本机的数据。</p></div>
          <span class="heading-symbol peach" aria-hidden="true">${renderIcon('user')}</span>
        </div>
      </header>

      <section class="me-profile-card">
        <div class="profile-identity"><span class="profile-symbol">${renderIcon('user')}</span><div><p class="eyebrow">我的时间估算</p><h2>${account ? `${formatNumber(account.remainingLifeDays)} 天` : '还没有设置时间估算'}</h2><span>${account ? `按 ${expectedLifeYears} 岁预期寿命估算` : '设置后显示预计剩余天数'}</span></div></div>
        <div class="local-status">${renderIcon('shield')} 仅保存在本机</div>
        <div class="profile-metrics">
          <div><span>记录日</span><strong>${recordDays}<em>天</em></strong></div>
          <div><span>生活记录</span><strong>${recentRecords.length}<em>条</em></strong></div>
          <div><span>已记录时长</span><strong class="duration-value">${formatDuration(recordedMinutes)}</strong></div>
        </div>
      </section>

      <section class="settings-section account-settings settings-group">
        <div class="settings-group-heading"><span class="settings-icon mint">${renderIcon('wallet')}</span><div><p class="eyebrow">时间估算</p><h2>${account ? '调整估算依据' : '设置剩余天数'}</h2><small>修改后会重新估算剩余天数</small></div></div>
        ${renderAccountForm(birthday, expectedLifeYears, false)}
      </section>

      <details class="settings-section privacy-card settings-group">
        <summary><span class="settings-icon warm">${renderIcon('shield')}</span><span class="summary-copy"><small>隐私说明</small><strong>当前数据只保存在此浏览器</strong><em>展开查看数据边界</em></span>${renderIcon('chevron')}</summary>
        <p>这个前端 Demo 不会把生日、记录或反馈发送到后端。清除浏览器数据后将无法恢复，你可以先导出备份。</p>
      </details>

      <section class="settings-section data-card settings-group">
        <div class="settings-group-heading"><span class="settings-icon blue">${renderIcon('database')}</span><div><p class="eyebrow">数据管理</p><h2>${recordDays} 个记录日 · ${recentRecords.length} 条记录</h2><small>先备份，再进行清理</small></div></div>
        <div class="data-actions settings-action-list">
          <button type="button" class="settings-action" data-export-data><span class="action-symbol">${renderIcon('download')}</span><span><strong>导出备份文件</strong><small>保存账户、记录与本地反馈</small></span>${renderIcon('chevron')}</button>
          ${isClearDataConfirming
            ? '<div class="danger-confirm"><p>清除后无法恢复，确定删除本机全部数据吗？</p><div><button type="button" class="danger" data-clear-data="confirm">确认清除</button><button type="button" data-clear-data="cancel">取消</button></div></div>'
            : `<button type="button" class="settings-action danger-text" data-clear-data="ask"><span class="action-symbol danger">${renderIcon('trash')}</span><span><strong>清除本机数据</strong><small>删除账户、记录与反馈</small></span>${renderIcon('chevron')}</button>`}
        </div>
      </section>

      <details class="settings-section feedback-card settings-group" ${isFeedbackExpanded ? 'open' : ''}>
        <summary>
          <span class="settings-icon peach">${renderIcon('help')}</span>
          <span class="summary-copy"><small>帮助与反馈</small><strong>问题与建议</strong><em>展开填写并复制反馈</em></span>
          ${renderIcon('chevron')}
        </summary>
        <form id="general-feedback-form">
          <textarea name="feedback" rows="3" maxlength="1000" placeholder="哪里让你困惑，或希望增加什么？" required></textarea>
          <p class="feedback-boundary">当前 Demo 不联网提交，团队不会自动收到。</p>
          <button type="submit" class="primary-action">${renderIcon('send')} 保存并复制反馈</button>
          <p class="form-message">${escapeHtml(feedbackMessage)}${generalFeedback.length > 0 && !feedbackMessage ? `已保存 ${generalFeedback.length} 条反馈。` : ''}</p>
        </form>
      </details>

      <p class="me-version">Life Wallet · H5 Demo v0.3</p>
    </section>
  `;
}

function renderAccountForm(birthday: string, expectedLifeYears: number, isOnboarding: boolean) {
  const birthdayLabel = birthday ? formatCalendarTriggerDate(birthday) : '请选择出生日期';
  const isSaved = Boolean(account && !isAccountDirty && !isOnboarding);
  return `
    <form class="account-form" id="account-form">
      <label><span>${renderIcon('calendar')} 出生日期</span><input name="birthday" type="hidden" value="${birthday}" /><button class="date-trigger${birthday ? '' : ' placeholder'}" type="button" data-open-calendar="birthday" aria-label="${birthday ? `选择出生日期，当前为 ${birthdayLabel}` : '选择出生日期'}"><span>${birthdayLabel}</span>${renderIcon('chevron')}</button></label>
      <label><span>${renderIcon('life')} 预期寿命${isOnboarding ? '<small>可稍后修改</small>' : ''}</span><span class="number-field"><input name="expectedLifeYears" type="number" min="1" max="120" value="${expectedLifeYears}" required /><em>岁</em></span></label>
      <button class="primary-action account-save" type="submit" ${!birthday || isSaved ? 'disabled' : ''}>${isSaved ? '设置已保存' : account ? '保存修改' : '生成剩余天数'}</button>
      <p class="form-message">${escapeHtml(formMessage)}</p>
    </form>
  `;
}

function renderCalendarDialog() {
  if (!calendarTarget) return '';
  const selectedValue = calendarTarget === 'record'
    ? recordLifeDate
    : (accountBirthdayDraft ?? account?.birthday ?? '');
  const title = calendarTarget === 'record' ? '选择记录日期' : '选择出生日期';
  const periodTitle = calendarView === 'days'
    ? `${calendarYear}年 ${calendarMonth + 1}月`
    : calendarView === 'months'
      ? `${calendarYear}年`
      : `${getYearPageStart(calendarYear)}—${getYearPageStart(calendarYear) + 11}年`;

  return `
    <div class="calendar-overlay" data-calendar-close="backdrop">
      <section class="calendar-dialog" role="dialog" aria-modal="true" aria-labelledby="calendar-title" data-calendar-panel>
        <header class="calendar-dialog-heading">
          <div><p>${renderIcon('calendar')} Life Wallet 日历</p><h2 id="calendar-title">${title}</h2></div>
          <button type="button" data-calendar-close="button" aria-label="关闭日期选择">完成</button>
        </header>
        <div class="calendar-toolbar">
          <button type="button" data-calendar-shift="previous" aria-label="上一${calendarView === 'days' ? '个月' : calendarView === 'months' ? '年' : '组年份'}" ${calendarCanShift(-1) ? '' : 'disabled'}>${renderIcon('back')}</button>
          <button type="button" class="calendar-period" data-calendar-drill aria-label="切换日期选择层级">${periodTitle}${calendarView === 'years' ? '' : renderIcon('chevron')}</button>
          <button type="button" data-calendar-shift="next" aria-label="下一${calendarView === 'days' ? '个月' : calendarView === 'months' ? '年' : '组年份'}" ${calendarCanShift(1) ? '' : 'disabled'}>${renderIcon('chevron')}</button>
        </div>
        ${calendarView === 'days' ? renderCalendarDays(selectedValue) : calendarView === 'months' ? renderCalendarMonths() : renderCalendarYears()}
        <footer class="calendar-footer">
          <span>${calendarTarget === 'record' ? '可补记今天及过去的生活' : '选择后再保存账户修改'}</span>
          ${calendarTarget === 'record' ? '<button type="button" data-calendar-today>回到今天</button>' : ''}
        </footer>
      </section>
    </div>
  `;
}

function renderCalendarDays(selectedValue: string) {
  const weekdayLabels = ['一', '二', '三', '四', '五', '六', '日'];
  const month = getCalendarMonth(calendarYear, calendarMonth, todayValue());
  const today = todayValue();
  const cells = [
    ...Array.from({ length: month.firstWeekday }, () => '<span class="calendar-blank" aria-hidden="true"></span>'),
    ...month.days.map(({ day, value, disabled }) => {
      return `<button type="button" data-calendar-day="${value}" class="${value === selectedValue ? 'selected' : ''} ${value === today ? 'today' : ''}" ${disabled ? 'disabled' : ''} aria-label="${calendarYear}年${calendarMonth + 1}月${day}日" aria-pressed="${value === selectedValue}">${day}</button>`;
    }),
  ].join('');

  return `<div class="calendar-weekdays">${weekdayLabels.map((label) => `<span>${label}</span>`).join('')}</div><div class="calendar-days">${cells}</div>`;
}

function renderCalendarMonths() {
  const months = ['一月', '二月', '三月', '四月', '五月', '六月', '七月', '八月', '九月', '十月', '十一月', '十二月'];
  const today = new Date();
  return `<div class="calendar-choice-grid months">${months.map((label, month) => {
    const disabled = calendarYear > today.getFullYear() || (calendarYear === today.getFullYear() && month > today.getMonth());
    return `<button type="button" data-calendar-month="${month}" class="${month === calendarMonth ? 'selected' : ''}" ${disabled ? 'disabled' : ''}>${label}</button>`;
  }).join('')}</div>`;
}

function renderCalendarYears() {
  const start = getYearPageStart(calendarYear);
  const currentYear = new Date().getFullYear();
  return `<div class="calendar-choice-grid years">${Array.from({ length: 12 }, (_, index) => start + index).map((year) => `<button type="button" data-calendar-year="${year}" class="${year === calendarYear ? 'selected' : ''}" ${year > currentYear || year < 1900 ? 'disabled' : ''}>${year}</button>`).join('')}</div>`;
}

function renderAgentScreen() {
  const contextRecord = recentRecords.find((record) => record.recordId === agentContextRecordId);
  const originLabel = tabLabel(agentOriginTab);
  const contextActivity = contextRecord?.activities[0];
  const contextNewMinutes = contextActivity ? Math.min(1440, contextActivity.durationMinutes + 30) : 60;
  return `
    <section class="screen agent-screen">
      <header class="agent-page-header">
        <button type="button" data-close-agent aria-label="返回${originLabel}">${renderIcon('back')}</button>
        <div class="agent-page-identity">
          <span>${renderIcon('agent')}</span>
          <div><h1>Life Agent</h1><p>本地 Mock · 只处理生活记录</p></div>
        </div>
        <span class="agent-status" aria-label="当前可用"></span>
      </header>

      <div class="agent-scope-note">我可以查询、新增、修改或删除本机记录。修改和删除都会先展示差异，确认后才执行。</div>

      <section class="agent-conversation" id="agent-conversation" aria-live="polite">
        ${agentMessages.map((message) => `
          <article class="agent-message ${message.role}">
            ${message.role === 'agent' ? `<span class="message-avatar" aria-hidden="true">${renderIcon('agent')}</span>` : ''}
            <div class="message-content"><p>${escapeHtml(message.content)}</p>${message.recordIds ? renderAgentRecordCards(message.recordIds) : ''}</div>
          </article>
        `).join('')}
        ${isAgentThinking ? `<article class="agent-message agent"><span class="message-avatar" aria-hidden="true">${renderIcon('agent')}</span><div class="message-content thinking"><span></span><span></span><span></span></div></article>` : ''}
        ${renderAgentPendingAction()}
      </section>

      ${agentPendingAction || isAgentThinking ? '' : `
        <div class="agent-suggestions" aria-label="对话示例">
          ${contextRecord && contextActivity ? `
            <button type="button" data-agent-prompt="查看这条记录">查看这条记录</button>
            <button type="button" data-agent-prompt="把这条记录的${escapeHtml(contextActivity.title)}改成${formatDuration(contextNewMinutes)}">修改这条记录</button>
            <button type="button" data-agent-prompt="删除这条记录里的${escapeHtml(contextActivity.title)}">删除这条记录</button>
          ` : `
            <button type="button" data-agent-prompt="我今天记了什么？">我今天记了什么？</button>
            <button type="button" data-agent-prompt="把今天的上班从 4 小时修改为 8 小时">修改今天的时长</button>
            <button type="button" data-agent-prompt="记下今天散步 30 分钟">记下一段生活</button>
          `}
        </div>
      `}

      <form class="agent-composer" id="agent-form">
        <textarea name="message" rows="2" maxlength="2000" placeholder="${contextRecord ? '例如：把这条记录的工作改成 6 小时…' : '例如：把今天的上班从 4 小时改成 8 小时…'}" aria-label="给 Life Agent 发消息" required>${escapeHtml(agentDraft)}</textarea>
        <button type="submit" aria-label="发送给 Life Agent" ${isAgentThinking || agentPendingAction ? 'disabled' : ''}>${renderIcon('send')}</button>
      </form>
    </section>
  `;
}

function tabLabel(tab: Tab) {
  return tab === 'today' ? '今天' : tab === 'life' ? '人生' : '我的';
}

function renderAgentRecordCards(recordIds: number[]) {
  return recordIds.map((recordId) => recentRecords.find((record) => record.recordId === recordId))
    .filter((record): record is TodayRecord => Boolean(record))
    .map((record) => `
      <div class="agent-record-card">
        <div><time>${formatLifeDate(record.lifeDate)}</time><span>${record.activities.length} 个片段</span></div>
        <p>${escapeHtml(record.content)}</p>
        <small>${escapeHtml(record.summary)}</small>
      </div>
    `).join('');
}

function renderAgentPendingAction() {
  const pendingAction = agentPendingAction;
  if (!pendingAction) return '';
  if (pendingAction.type === 'create-record') {
    const preview = pendingAction.preview;
    return `
      <section class="agent-confirm-card" aria-label="待确认的新记录">
        <p class="eyebrow">新增记录 · 等待确认</p>
        <h2>${formatLifeDate(preview.lifeDate)}</h2>
        <p>${escapeHtml(preview.content)}</p>
        <div class="agent-change-list">${preview.activities.map((activity) => `<div><span>${escapeHtml(activity.title)}</span><strong>${formatDuration(activity.durationMinutes)}${activity.estimated ? ' · 估算' : ''}</strong></div>`).join('')}</div>
        <div class="agent-confirm-actions"><button type="button" data-agent-action="cancel">取消</button><button class="confirm" type="button" data-agent-action="confirm">确认记录</button></div>
      </section>
    `;
  }

  const record = recentRecords.find((item) => item.recordId === pendingAction.recordId);
  if (!record) return '';
  if (pendingAction.type === 'update-duration') {
    return `
      <section class="agent-confirm-card" aria-label="待确认的记录修改">
        <p class="eyebrow">修改记录 · 等待确认</p>
        <h2>${escapeHtml(pendingAction.activityTitle)}</h2>
        <p>${escapeHtml(record.content)}</p>
        <div class="agent-diff"><span>${formatDuration(pendingAction.oldMinutes)}</span>${renderIcon('chevron')}<strong>${formatDuration(pendingAction.newMinutes)}</strong></div>
        <small>只修改这段活动的时长，其他片段保持不变。</small>
        <div class="agent-confirm-actions"><button type="button" data-agent-action="cancel">取消</button><button class="confirm" type="button" data-agent-action="confirm">确认修改</button></div>
      </section>
    `;
  }

  return `
    <section class="agent-confirm-card danger-card" aria-label="待确认的记录删除">
      <p class="eyebrow">删除记录 · 等待确认</p>
      <h2>${formatLifeDate(record.lifeDate)}</h2>
      <p>${escapeHtml(record.content)}</p>
      <small>这会删除整条记录及其中 ${record.activities.length} 个生活片段。</small>
      <div class="agent-confirm-actions"><button type="button" data-agent-action="cancel">取消</button><button class="danger" type="button" data-agent-action="confirm">确认删除</button></div>
    </section>
  `;
}

function bindEvents() {
  document.querySelectorAll<HTMLButtonElement>('[data-tab]').forEach((button) => {
    button.addEventListener('click', () => {
      activeTab = button.dataset.tab as Tab;
      openRecordMenuId = null;
      pendingDeleteRecordId = null;
      formMessage = '';
      render();
      window.scrollTo(0, 0);
    });
  });

  document.querySelector<HTMLButtonElement>('[data-start-account]')?.addEventListener('click', () => {
    isAccountOnboarding = true;
    formMessage = '';
    render();
    window.scrollTo(0, 0);
  });

  document.querySelector<HTMLButtonElement>('[data-cancel-onboarding]')?.addEventListener('click', () => {
    isAccountOnboarding = false;
    formMessage = '';
    render();
  });

  document.querySelectorAll<HTMLButtonElement>('[data-life-view]').forEach((button) => {
    button.addEventListener('click', () => {
      activeLifeView = button.dataset.lifeView as LifeView;
      render();
      window.scrollTo(0, 0);
    });
  });

  document.querySelector<HTMLButtonElement>('[data-open-agent]')?.addEventListener('click', () => openAgent());
  document.querySelector<HTMLButtonElement>('[data-close-agent]')?.addEventListener('click', () => {
    isAgentOpen = false;
    agentContextRecordId = null;
    render();
    window.scrollTo(0, 0);
  });

  document.querySelectorAll<HTMLButtonElement>('[data-agent-record]').forEach((button) => {
    button.addEventListener('click', () => openAgent(Number(button.dataset.agentRecord)));
  });

  document.querySelectorAll<HTMLButtonElement>('[data-record-detail]').forEach((button) => {
    button.addEventListener('click', () => {
      const recordId = Number(button.dataset.recordDetail);
      expandedRecordId = expandedRecordId === recordId ? null : recordId;
      render();
      document.querySelector<HTMLButtonElement>(`[data-record-detail="${recordId}"]`)?.focus();
    });
  });

  document.querySelector<HTMLButtonElement>('[data-worldview-toggle]')?.addEventListener('click', () => {
    isWorldviewExpanded = !isWorldviewExpanded;
    render();
  });

  document.querySelectorAll<HTMLButtonElement>('[data-quick-prompt]').forEach((button) => {
    button.addEventListener('click', () => {
      const prompt = button.dataset.quickPrompt ?? '';
      const currentContent = document.querySelector<HTMLTextAreaElement>('#record-form textarea[name="content"]')?.value ?? recordDraft;
      recordDraft = currentContent.trim() ? `${currentContent.trim()}，${prompt}` : prompt;
      render();
      document.querySelector<HTMLTextAreaElement>('#record-form textarea[name="content"]')?.focus();
    });
  });

  document.querySelector<HTMLTextAreaElement>('#record-form textarea[name="content"]')?.addEventListener('input', (event) => {
    recordDraft = (event.currentTarget as HTMLTextAreaElement).value;
  });

  document.querySelectorAll<HTMLButtonElement>('[data-open-calendar]').forEach((button) => {
    button.addEventListener('click', () => openCalendar(button.dataset.openCalendar as CalendarTarget));
  });

  document.querySelectorAll<HTMLElement>('[data-calendar-close]').forEach((element) => {
    element.addEventListener('click', (event) => {
      if (element.dataset.calendarClose === 'backdrop' && event.target !== element) return;
      closeCalendar();
    });
  });

  document.querySelector<HTMLButtonElement>('[data-calendar-drill]')?.addEventListener('click', () => {
    calendarView = calendarView === 'days' ? 'months' : 'years';
    renderCalendarAndFocus();
  });

  document.querySelectorAll<HTMLButtonElement>('[data-calendar-shift]').forEach((button) => {
    button.addEventListener('click', () => {
      shiftCalendar(button.dataset.calendarShift === 'previous' ? -1 : 1);
      renderCalendarAndFocus();
    });
  });

  document.querySelectorAll<HTMLButtonElement>('[data-calendar-year]').forEach((button) => {
    button.addEventListener('click', () => {
      calendarYear = Number(button.dataset.calendarYear);
      calendarView = 'months';
      renderCalendarAndFocus();
    });
  });

  document.querySelectorAll<HTMLButtonElement>('[data-calendar-month]').forEach((button) => {
    button.addEventListener('click', () => {
      calendarMonth = Number(button.dataset.calendarMonth);
      calendarView = 'days';
      renderCalendarAndFocus();
    });
  });

  document.querySelectorAll<HTMLButtonElement>('[data-calendar-day]').forEach((button) => {
    button.addEventListener('click', () => selectCalendarDate(button.dataset.calendarDay ?? todayValue()));
  });

  document.querySelector<HTMLButtonElement>('[data-calendar-today]')?.addEventListener('click', () => selectCalendarDate(todayValue()));

  document.querySelector<HTMLFormElement>('#record-form')?.addEventListener('submit', (event) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget as HTMLFormElement);
    void analyzeRecord(String(formData.get('content') ?? ''), String(formData.get('lifeDate') ?? recordLifeDate));
  });

  document.querySelectorAll<HTMLInputElement>('[data-preview-title]').forEach((input) => {
    input.addEventListener('change', () => updatePreviewActivity(Number(input.dataset.previewTitle), 'title', input.value));
  });
  document.querySelectorAll<HTMLInputElement>('[data-preview-duration]').forEach((input) => {
    input.addEventListener('change', () => updatePreviewActivity(Number(input.dataset.previewDuration), 'duration', input.value));
  });

  document.querySelectorAll<HTMLButtonElement>('[data-preview-action]').forEach((button) => {
    button.addEventListener('click', () => button.dataset.previewAction === 'modify' ? modifyPreview() : void confirmPreview());
  });

  document.querySelectorAll<HTMLButtonElement>('[data-record-feedback]').forEach((button) => {
    button.addEventListener('click', () => void submitRecordFeedback(Number(button.dataset.recordFeedback), button.dataset.rating as FeedbackRating));
  });

  document.querySelectorAll<HTMLButtonElement>('[data-edit-record]').forEach((button) => {
    button.addEventListener('click', () => editRecord(Number(button.dataset.editRecord)));
  });

  document.querySelectorAll<HTMLButtonElement>('[data-record-menu]').forEach((button) => {
    button.addEventListener('click', () => {
      const recordId = Number(button.dataset.recordMenu);
      openRecordMenuId = openRecordMenuId === recordId ? null : recordId;
      pendingDeleteRecordId = null;
      render();
      document.querySelector<HTMLButtonElement>(`[data-record-menu="${recordId}"]`)?.focus();
    });
  });

  document.querySelectorAll<HTMLButtonElement>('[data-delete-record]').forEach((button) => {
    button.addEventListener('click', () => void handleDeleteRecord(Number(button.dataset.deleteRecord), button.dataset.deleteAction ?? 'ask'));
  });

  document.querySelector<HTMLFormElement>('#account-form')?.addEventListener('submit', (event) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget as HTMLFormElement);
    void saveAccount({
      birthday: String(formData.get('birthday') ?? ''),
      expectedLifeYears: Number(formData.get('expectedLifeYears')),
    });
  });

  document.querySelectorAll<HTMLInputElement>('#account-form input[type="number"]').forEach((input) => {
    input.addEventListener('input', () => {
      accountExpectedLifeYearsDraft = input.value === '' ? null : Number(input.value);
      isAccountDirty = true;
      const saveButton = document.querySelector<HTMLButtonElement>('.account-save');
      if (saveButton) saveButton.disabled = !accountBirthdayDraft;
    });
  });

  document.querySelector<HTMLButtonElement>('[data-export-data]')?.addEventListener('click', () => void exportData());
  document.querySelectorAll<HTMLButtonElement>('[data-clear-data]').forEach((button) => {
    button.addEventListener('click', () => void handleClearData(button.dataset.clearData ?? 'ask'));
  });

  document.querySelector<HTMLFormElement>('#general-feedback-form')?.addEventListener('submit', (event) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget as HTMLFormElement);
    void submitGeneralFeedback(String(formData.get('feedback') ?? ''));
  });

  document.querySelector<HTMLDetailsElement>('.feedback-card')?.addEventListener('toggle', (event) => {
    isFeedbackExpanded = (event.currentTarget as HTMLDetailsElement).open;
  });

  document.querySelector<HTMLTextAreaElement>('#agent-form textarea[name="message"]')?.addEventListener('input', (event) => {
    agentDraft = (event.currentTarget as HTMLTextAreaElement).value;
  });

  document.querySelector<HTMLFormElement>('#agent-form')?.addEventListener('submit', (event) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget as HTMLFormElement);
    void handleAgentMessage(String(formData.get('message') ?? ''));
  });

  document.querySelectorAll<HTMLButtonElement>('[data-agent-prompt]').forEach((button) => {
    button.addEventListener('click', () => void handleAgentMessage(button.dataset.agentPrompt ?? ''));
  });

  document.querySelectorAll<HTMLButtonElement>('[data-agent-action]').forEach((button) => {
    button.addEventListener('click', () => button.dataset.agentAction === 'confirm' ? void confirmAgentAction() : cancelAgentAction());
  });
}

function syncVisibleDrafts() {
  recordDraft = document.querySelector<HTMLTextAreaElement>('#record-form textarea[name="content"]')?.value ?? recordDraft;
  const expectedLifeInput = document.querySelector<HTMLInputElement>('#account-form input[name="expectedLifeYears"]');
  if (expectedLifeInput?.value) accountExpectedLifeYearsDraft = Number(expectedLifeInput.value);
}

function openCalendar(target: CalendarTarget) {
  syncVisibleDrafts();
  calendarTarget = target;
  calendarView = 'days';
  const neutralBirthdayView = `${new Date().getFullYear() - 30}-01-01`;
  const selected = parseIsoDate(target === 'record' ? recordLifeDate : (accountBirthdayDraft ?? account?.birthday ?? neutralBirthdayView));
  calendarYear = selected.year;
  calendarMonth = selected.month;
  document.body.classList.add('calendar-open');
  renderCalendarAndFocus();
}

function closeCalendar() {
  const closingTarget = calendarTarget;
  calendarTarget = null;
  document.body.classList.remove('calendar-open');
  render();
  window.requestAnimationFrame(() => document.querySelector<HTMLButtonElement>(`[data-open-calendar="${closingTarget ?? 'record'}"]`)?.focus());
}

function selectCalendarDate(value: string) {
  if (calendarTarget === 'record') {
    recordLifeDate = value;
  } else if (calendarTarget === 'birthday') {
    accountBirthdayDraft = value;
    isAccountDirty = true;
  }
  closeCalendar();
}

function shiftCalendar(direction: -1 | 1) {
  if (!calendarCanShift(direction)) return;
  if (calendarView === 'days') {
    const shifted = new Date(calendarYear, calendarMonth + direction, 1);
    calendarYear = shifted.getFullYear();
    calendarMonth = shifted.getMonth();
  } else if (calendarView === 'months') {
    calendarYear += direction;
  } else {
    calendarYear += direction * 12;
  }
}

function calendarCanShift(direction: -1 | 1) {
  const today = new Date();
  if (direction < 0) {
    if (calendarView === 'days') return calendarYear > 1900 || calendarMonth > 0;
    if (calendarView === 'months') return calendarYear > 1900;
    return getYearPageStart(calendarYear) > getYearPageStart(1900);
  }
  if (calendarView === 'days') return calendarYear < today.getFullYear() || calendarMonth < today.getMonth();
  if (calendarView === 'months') return calendarYear < today.getFullYear();
  return getYearPageStart(calendarYear) < getYearPageStart(today.getFullYear());
}

function renderCalendarAndFocus() {
  render();
  window.requestAnimationFrame(() => document.querySelector<HTMLButtonElement>('.calendar-dialog button:not(:disabled)')?.focus());
}

function openAgent(recordId: number | null = null) {
  agentOriginTab = activeTab;
  isAgentOpen = true;
  openRecordMenuId = null;
  pendingDeleteRecordId = null;
  if (recordId && agentContextRecordId !== recordId) {
    const record = recentRecords.find((item) => item.recordId === recordId);
    if (record) {
      agentContextRecordId = recordId;
      agentMessages.push({
        id: Date.now(),
        role: 'agent',
        content: '我已经定位到这条记录。告诉我想修改什么；执行前我会展示差异并请你确认。',
        recordIds: [recordId],
      });
    }
  }
  render();
  window.scrollTo(0, 0);
  document.querySelector<HTMLTextAreaElement>('#agent-form textarea[name="message"]')?.focus();
}

async function handleAgentMessage(message: string) {
  const content = message.trim();
  if (!content || isAgentThinking || agentPendingAction) return;

  agentMessages.push({ id: Date.now(), role: 'user', content });
  agentDraft = '';
  isAgentThinking = true;
  render();
  scrollAgentToBottom();

  await new Promise((resolve) => window.setTimeout(resolve, 480));
  const orderedRecords = agentContextRecordId
    ? [
      ...recentRecords.filter((record) => record.recordId === agentContextRecordId),
      ...recentRecords.filter((record) => record.recordId !== agentContextRecordId),
    ]
    : recentRecords;
  const intent = resolveMockAgentIntent(content, orderedRecords, todayValue(), agentContextRecordId);

  if (intent.kind === 'create') {
    try {
      const preview = await previewMockRecord({ lifeDate: todayValue(), content: intent.content });
      agentMessages.push({ id: Date.now() + 1, role: 'agent', content: '我整理出一条新记录。确认后才会保存到本机。' });
      agentPendingAction = { type: 'create-record', preview };
    } catch (error) {
      agentMessages.push({ id: Date.now() + 1, role: 'agent', content: error instanceof Error ? error.message : '暂时无法整理这段记录。' });
    }
  } else if (intent.kind === 'list') {
    agentMessages.push({ id: Date.now() + 1, role: 'agent', content: intent.message, recordIds: intent.recordIds });
  } else if (intent.kind === 'update-duration') {
    agentMessages.push({ id: Date.now() + 1, role: 'agent', content: intent.message });
    agentPendingAction = {
      type: 'update-duration',
      recordId: intent.recordId,
      activityIndex: intent.activityIndex,
      activityTitle: intent.activityTitle,
      oldMinutes: intent.oldMinutes,
      newMinutes: intent.newMinutes,
    };
  } else if (intent.kind === 'delete-record') {
    agentMessages.push({ id: Date.now() + 1, role: 'agent', content: intent.message });
    agentPendingAction = { type: 'delete-record', recordId: intent.recordId };
  } else {
    agentMessages.push({ id: Date.now() + 1, role: 'agent', content: intent.message });
  }

  isAgentThinking = false;
  render();
  scrollAgentToBottom();
}

async function confirmAgentAction() {
  if (!agentPendingAction) return;
  const action = agentPendingAction;
  isAgentThinking = true;
  render();

  try {
    if (action.type === 'create-record') {
      const saved = await saveMockRecord(action.preview);
      upsertRecentRecord(saved);
      agentMessages.push({ id: Date.now(), role: 'agent', content: '已经保存这条记录。你可以继续补充，或者让我查询今天的记录。', recordIds: [saved.recordId] });
    } else if (action.type === 'update-duration') {
      const record = recentRecords.find((item) => item.recordId === action.recordId);
      if (!record) throw new Error('这条记录已经不存在，无法继续修改。');
      const activities = record.activities.map((activity, index) => index === action.activityIndex
        ? { ...activity, durationMinutes: action.newMinutes, estimated: false }
        : { ...activity });
      const dimensionSummary = summarizeDimensions(activities);
      const saved = await saveMockRecord({
        lifeDate: record.lifeDate,
        content: replaceDurationInContent(record.content, action.oldMinutes, action.newMinutes, action.activityTitle),
        summary: buildRecordSummary(dimensionSummary, record.stateDescription),
        stateDescription: record.stateDescription,
        activities,
        dimensionSummary,
        needsConfirmation: activities.some((activity) => activity.estimated),
      }, record.recordId);
      upsertRecentRecord(saved);
      agentMessages.push({ id: Date.now(), role: 'agent', content: `已经把“${action.activityTitle}”从 ${formatDuration(action.oldMinutes)}改为 ${formatDuration(action.newMinutes)}。`, recordIds: [saved.recordId] });
    } else {
      recentRecords = await deleteMockRecord(action.recordId);
      recordFeedback = recordFeedback.filter((item) => item.recordId !== action.recordId);
      agentMessages.push({ id: Date.now(), role: 'agent', content: '这条记录已经从本机删除。' });
      if (agentContextRecordId === action.recordId) agentContextRecordId = null;
    }
  } catch (error) {
    agentMessages.push({ id: Date.now(), role: 'agent', content: error instanceof Error ? error.message : '操作失败，请稍后再试。' });
  }

  agentPendingAction = null;
  isAgentThinking = false;
  render();
  scrollAgentToBottom();
}

function cancelAgentAction() {
  agentPendingAction = null;
  agentMessages.push({ id: Date.now(), role: 'agent', content: '已取消，没有更改任何记录。' });
  render();
  scrollAgentToBottom();
}

function upsertRecentRecord(record: TodayRecord) {
  recentRecords = [record, ...recentRecords.filter((item) => item.recordId !== record.recordId)]
    .sort((a, b) => b.lifeDate.localeCompare(a.lifeDate) || b.createdAt.localeCompare(a.createdAt));
}

function buildRecordSummary(dimensions: TodayRecord['dimensionSummary'], stateDescription: string) {
  const [first, second] = dimensions;
  const stateCopy = stateDescription ? `你还提到自己${stateDescription}。` : '';
  return second
    ? `从这段记录看，投入较多的是${first.dimension}，同时也记录了${second.dimension}。${stateCopy}`
    : `从这段记录看，今天主要记录了${first.dimension}相关的生活片段。${stateCopy}`;
}

function replaceDurationInContent(content: string, oldMinutes: number, newMinutes: number, activityTitle: string) {
  const oldPattern = oldMinutes % 60 === 0
    ? new RegExp(`${oldMinutes / 60}\\s*(?:个)?\\s*小时`)
    : new RegExp(`${oldMinutes}\\s*分钟`);
  if (oldPattern.test(content)) return content.replace(oldPattern, formatDuration(newMinutes));
  return `${content}（Agent 修正：${activityTitle} ${formatDuration(newMinutes)}）`;
}

function scrollAgentToBottom() {
  window.requestAnimationFrame(() => window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' }));
}

async function initialize() {
  try {
    [account, recentRecords, recordFeedback, generalFeedback] = await Promise.all([
      getMockAccount(), getMockRecentRecords(), getMockRecordFeedback(), getMockGeneralFeedback(),
    ]);
    accountBirthdayDraft = account?.birthday ?? null;
    accountExpectedLifeYearsDraft = account?.expectedLifeYears ?? null;
  } finally {
    isLoading = false;
    render();
  }
}

async function analyzeRecord(content: string, lifeDate: string) {
  recordDraft = content.trim();
  recordLifeDate = lifeDate;
  recordMessage = '';
  recordPreview = null;
  isAnalyzingRecord = true;
  render();
  try {
    recordPreview = await previewMockRecord({ lifeDate, content });
    recordMessage = '请确认 AI 对这段记录的理解。';
  } catch (error) {
    recordMessage = error instanceof Error ? error.message : '暂时无法理解这条记录，请稍后再试。';
  } finally {
    isAnalyzingRecord = false;
    render();
    if (recordPreview) {
      window.requestAnimationFrame(() => document.querySelector<HTMLElement>('[data-record-preview]')?.scrollIntoView({ behavior: 'smooth', block: 'start' }));
    }
  }
}

function updatePreviewActivity(index: number, field: 'title' | 'duration', value: string) {
  if (!recordPreview?.activities[index]) return;
  if (field === 'title') recordPreview.activities[index].title = value.trim() || recordPreview.activities[index].title;
  if (field === 'duration') {
    recordPreview.activities[index].durationMinutes = Math.min(1440, Math.max(1, Number(value) || 1));
    recordPreview.activities[index].estimated = false;
  }
  recordPreview.dimensionSummary = summarizeDimensions(recordPreview.activities);
  const [first, second] = recordPreview.dimensionSummary;
  const stateCopy = recordPreview.stateDescription ? `你还提到自己${recordPreview.stateDescription}。` : '';
  recordPreview.summary = second
    ? `从这段记录看，投入较多的是${first.dimension}，同时也记录了${second.dimension}。${stateCopy}`
    : `从这段记录看，今天主要记录了${first.dimension}相关的生活片段。${stateCopy}`;
  recordPreview.needsConfirmation = recordPreview.activities.some((activity) => activity.estimated);
  render();
}

function modifyPreview() {
  if (!recordPreview) return;
  recordDraft = recordPreview.content;
  recordPreview = null;
  recordMessage = '原文已回填，你可以修改后重新发送。';
  render();
  document.querySelector<HTMLTextAreaElement>('#record-form textarea[name="content"]')?.focus();
}

async function confirmPreview() {
  if (!recordPreview) return;
  recordMessage = '正在保存这段记录...';
  render();
  try {
    const saved = await saveMockRecord(recordPreview, editingRecordId);
    upsertRecentRecord(saved);
    recordPreview = null;
    recordDraft = '';
    editingRecordId = null;
    recordMessage = '已经保存。请告诉我这次理解是否准确。';
  } catch (error) {
    recordMessage = error instanceof Error ? error.message : '保存失败，请稍后再试。';
  }
  render();
}

async function submitRecordFeedback(recordId: number, rating: FeedbackRating) {
  recordFeedback = await saveMockRecordFeedback(recordId, rating);
  render();
}

function editRecord(recordId: number) {
  const record = recentRecords.find((item) => item.recordId === recordId);
  if (!record) return;
  editingRecordId = recordId;
  recordLifeDate = record.lifeDate;
  recordDraft = record.content;
  recordPreview = null;
  recordMessage = '正在修正这条记录，重新发送并确认后会覆盖旧版本。';
  openRecordMenuId = null;
  activeTab = 'today';
  render();
  window.scrollTo({ top: 0, behavior: 'smooth' });
  document.querySelector<HTMLTextAreaElement>('#record-form textarea[name="content"]')?.focus();
}

async function handleDeleteRecord(recordId: number, action: string) {
  if (action === 'ask') {
    pendingDeleteRecordId = recordId;
    render();
    return;
  }
  if (action === 'cancel') {
    pendingDeleteRecordId = null;
    render();
    return;
  }
  recentRecords = await deleteMockRecord(recordId);
  recordFeedback = recordFeedback.filter((item) => item.recordId !== recordId);
  pendingDeleteRecordId = null;
  openRecordMenuId = null;
  render();
}

async function saveAccount(payload: Pick<Account, 'birthday' | 'expectedLifeYears'>) {
  const wasCreatingAccount = !account;
  formMessage = '正在保存...';
  render();
  try {
    account = await saveMockAccount(payload);
    accountBirthdayDraft = account.birthday;
    accountExpectedLifeYearsDraft = account.expectedLifeYears;
    isAccountDirty = false;
    if (wasCreatingAccount) {
      isAccountOnboarding = false;
      activeTab = 'today';
      formMessage = '';
      recordMessage = '时间估算已设置，从今天的一段生活开始吧。';
    } else {
      formMessage = '时间估算设置已保存。';
    }
  } catch (error) {
    formMessage = error instanceof Error ? error.message : '保存失败，请稍后再试。';
  }
  render();
}

async function exportData() {
  const data = await getMockExportData();
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `life-wallet-${todayValue()}.json`;
  link.click();
  URL.revokeObjectURL(url);
  formMessage = '数据已导出为 JSON 文件。';
  render();
}

async function handleClearData(action: string) {
  if (action === 'ask') {
    isClearDataConfirming = true;
    render();
    return;
  }
  if (action === 'cancel') {
    isClearDataConfirming = false;
    render();
    return;
  }
  await clearMockUserData();
  account = null;
  recentRecords = [];
  recordFeedback = [];
  generalFeedback = [];
  recordPreview = null;
  recordDraft = '';
  isClearDataConfirming = false;
  isAccountDirty = false;
  isFeedbackExpanded = false;
  accountBirthdayDraft = null;
  accountExpectedLifeYearsDraft = null;
  activeTab = 'today';
  isAccountOnboarding = false;
  formMessage = '本机中的 Life Wallet 数据已清除。';
  render();
}

async function submitGeneralFeedback(content: string) {
  const normalizedContent = content.trim();
  isFeedbackExpanded = true;
  feedbackMessage = '正在保存并复制...';
  render();
  try {
    generalFeedback = await saveMockGeneralFeedback(normalizedContent);
    const copied = await copyTextToClipboard(`Life Wallet 体验反馈\n${normalizedContent}`);
    feedbackMessage = copied
      ? '已保存在当前浏览器并复制，请粘贴给体验邀请人。'
      : '已保存在当前浏览器；浏览器未允许复制，请手动复制后发送给体验邀请人。';
  } catch (error) {
    feedbackMessage = error instanceof Error ? error.message : '保存失败，请稍后再试。';
  }
  render();
}

async function copyTextToClipboard(content: string) {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(content);
      return true;
    }
    const textarea = document.createElement('textarea');
    textarea.value = content;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.append(textarea);
    textarea.select();
    const copied = document.execCommand('copy');
    textarea.remove();
    return copied;
  } catch {
    return false;
  }
}

function renderIcon(name: IconName) {
  // 全站只使用同一套 Lucide 线性图标与线宽，Agent 也采用温和的对话符号，不再单独绘制机器人。
  const iconNodes: Record<IconName, IconNode> = {
    back: ArrowLeft,
    home: House,
    life: Sprout,
    user: UserRound,
    info: Info,
    agent: MessageCircleHeart,
    send: ArrowUp,
    calendar: CalendarDays,
    edit: PencilLine,
    shield: ShieldCheck,
    database: DatabaseBackup,
    help: MessageCircleQuestion,
    download: Download,
    trash: Trash2,
    check: CircleCheck,
    sparkles: Sparkles,
    clock: Clock3,
    heart: HeartHandshake,
    chevron: ChevronRight,
    insights: ChartNoAxesColumnIncreasing,
    records: NotebookTabs,
    settings: Settings2,
    wallet: WalletCards,
    more: MoreHorizontal,
  };

  return createLucideElement(iconNodes[name], {
    class: `icon icon-${name}`,
    'aria-hidden': 'true',
    'stroke-width': 1.85,
  }).outerHTML;
}

function formatNumber(value: number) {
  return new Intl.NumberFormat('zh-CN').format(value);
}

function formatDuration(minutes: number) {
  if (minutes < 60) return `${minutes} 分钟`;
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return remainingMinutes === 0 ? `${hours} 小时` : `${hours} 小时 ${remainingMinutes} 分钟`;
}

function formatLifeDate(value: string) {
  return new Intl.DateTimeFormat('zh-CN', { month: 'long', day: 'numeric', weekday: 'short' })
    .format(new Date(`${value}T00:00:00`));
}

function formatHeaderDate(date: Date) {
  const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
  return `${date.getMonth() + 1}月${date.getDate()}日 ${weekdays[date.getDay()]}`;
}

function formatCalendarTriggerDate(value: string) {
  const { year, month, day } = parseIsoDate(value);
  return `${year}年${month + 1}月${day}日`;
}

function formatClockTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return new Intl.DateTimeFormat('zh-CN', { hour: '2-digit', minute: '2-digit', hour12: false }).format(date);
}

function todayValue() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}

function escapeHtml(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && calendarTarget) closeCalendar();
});

render();
void initialize();
