import './styles.css';
import {
  ArrowLeft,
  ArrowUp,
  CalendarDays,
  ChevronRight,
  CircleCheck,
  CircleQuestionMark,
  Clock3,
  DatabaseBackup,
  Download,
  HeartHandshake,
  House,
  Info,
  PencilLine,
  ShieldCheck,
  Sparkles,
  Sprout,
  Trash2,
  UserRound,
  createElement as createLucideElement,
  type IconNode,
} from 'lucide';
import { LIFE_MINUTES_PER_COIN, summarizeDimensions } from './mock/analysis.ts';
import { resolveMockAgentIntent } from './mock/agent.ts';
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
type IconName = 'back' | 'home' | 'life' | 'user' | 'info' | 'robot' | 'send' | 'calendar' | 'edit' | 'shield' | 'database' | 'help' | 'download' | 'trash' | 'check' | 'sparkles' | 'clock' | 'heart' | 'chevron';
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
let account: Account | null = null;
let recentRecords: TodayRecord[] = [];
let recordFeedback: RecordFeedback[] = [];
let generalFeedback: GeneralFeedback[] = [];
let recordPreview: RecordPreview | null = null;
let editingRecordId: number | null = null;
let pendingDeleteRecordId: number | null = null;
let expandedRecordId: number | null = null;
let isAnalyzingRecord = false;
let isWorldviewExpanded = false;
let isLoading = true;
let isClearDataConfirming = false;
let isAccountDirty = false;
let formMessage = '';
let recordMessage = '';
let feedbackMessage = '';
let recordDraft = '';
let recordLifeDate = todayValue();
let agentDraft = '';
let isAgentThinking = false;
let agentPendingAction: AgentPendingAction | null = null;
let agentContextRecordId: number | null = null;
let agentMessages: AgentMessage[] = [
  { id: 1, role: 'agent', content: '你好，我是 Life Agent。你可以让我查询、记录或修改生活片段；写操作会先请你确认。' },
];

function render() {
  appRoot.innerHTML = `
    <main class="app-shell${isAgentOpen ? ' agent-shell' : ''}">
      <div class="content-scroll">
        ${isLoading ? renderLoading() : (isAgentOpen ? renderAgentScreen() : `${renderToday()}${renderLife()}${renderMe()}`)}
      </div>
      ${isAgentOpen ? '' : `<nav class="tab-bar" aria-label="主导航">
        ${renderTabButton('today', 'home', '今天')}
        ${renderTabButton('life', 'life', '人生')}
        ${renderTabButton('me', 'user', '我的')}
      </nav>`}
    </main>
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
          ${renderIcon('robot')}
          <span>Life Agent</span>
        </button>
      </header>

      <section class="life-balance-strip">
        <div class="balance-main">
          <span class="balance-mark">${renderIcon('life')}</span>
          <div><p>人生余额</p><strong>${formatNumber(account.remainingLifeDays)}<em> 元</em></strong></div>
          <button class="icon-button" type="button" data-worldview-toggle aria-expanded="${isWorldviewExpanded}" aria-label="了解人生余额">${renderIcon('info')}</button>
        </div>
        <div class="daily-cost"><span>${renderIcon('check')}</span><p>今天会花掉<strong>1 元人生</strong></p></div>
        ${isWorldviewExpanded ? '<p class="worldview-explanation">1 天 = 1 元人生，24 小时共同组成这 1 元。记录不是为了补齐每一分钟，而是帮助你看见那些值得回看的生活片段。</p>' : ''}
      </section>

      <section class="record-hero">
        <div class="record-hero-copy">
          <h1>${dayRecords.length > 0 ? '这一元，还有哪些片段值得记住？' : '今天这一元，哪些片段值得记住？'}</h1>
          <p>像发消息一样告诉我，不用分类。</p>
        </div>
        ${renderComposer()}
        <div class="quick-record" aria-label="表达提示">
          <button type="button" data-quick-prompt="今天主要做了">${renderIcon('sparkles')}今天主要做了…</button>
          <button type="button" data-quick-prompt="最花时间的是">${renderIcon('clock')}最花时间的是…</button>
          <button type="button" data-quick-prompt="今天让我感觉">${renderIcon('heart')}今天让我感觉…</button>
        </div>
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
        <h1>先看看你还拥有多少元人生</h1>
        <p>设置出生日期和预期寿命后，我会生成你的人生余额。数据只保存在当前浏览器。</p>
        <button type="button" class="primary-action" data-tab="me">创建人生账户</button>
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
      <div class="agent-avatar" aria-hidden="true">${renderIcon('robot')}</div>
      <div class="agent-bubble muted"><p>${message}</p><span class="thinking-dots"><i></i><i></i><i></i></span></div>
    </section>
  `;
}

function renderRecordPreview() {
  if (!recordPreview) return '';
  const recordedMinutes = recordPreview.dimensionSummary.reduce((sum, item) => sum + item.durationMinutes, 0);

  return `
    <section class="record-preview">
      <div class="card-heading">
        <div><p class="eyebrow">AI 理解预览</p><h2>请确认这段理解</h2></div>
        <span>${formatLifeDate(recordPreview.lifeDate)}</span>
      </div>
      <div class="preview-activities">
        ${recordPreview.activities.map((activity, index) => `
          <article>
            <span>${escapeHtml(activity.dimension)} · ${escapeHtml(activity.domain)}${activity.estimated ? ' · 估算' : ''}</span>
            <label>活动<input data-preview-title="${index}" value="${escapeHtml(activity.title)}" aria-label="第 ${index + 1} 条活动名称" /></label>
            <label>时长<span class="duration-input"><input data-preview-duration="${index}" type="number" min="1" max="1440" value="${activity.durationMinutes}" aria-label="第 ${index + 1} 条活动时长" /><em>分钟</em></span></label>
          </article>
        `).join('')}
      </div>
      ${recordPreview.stateDescription ? `<p class="state-line"><strong>你提到：</strong>${escapeHtml(recordPreview.stateDescription)}</p>` : ''}
      <div class="preview-summary">
        <span>AI 今日总结</span>
        <p>${escapeHtml(recordPreview.summary)}</p>
      </div>
      <p class="coin-note">这些片段共约 <strong>${formatCoin(recordedMinutes)}</strong> 元人生；不要求补齐全天。</p>
      <div class="preview-actions">
        <p>以上理解是否准确？</p>
        <button type="button" class="secondary-action" data-preview-action="modify">修改原文</button>
        <button type="button" class="primary-action compact" data-preview-action="confirm">确认并保存</button>
      </div>
    </section>
  `;
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
      <div class="saved-source"><p>${escapeHtml(record.content)}</p><div class="saved-actions"><button type="button" data-agent-record="${record.recordId}">${renderIcon('robot')} Agent 修改</button><button type="button" data-edit-record="${record.recordId}">${renderIcon('edit')} 手动修正</button></div></div>
      <div class="analysis-heading">
        <div class="agent-avatar small" aria-hidden="true">${renderIcon('robot')}</div>
        <div><p class="eyebrow">我理解的是</p><p>${escapeHtml(record.summary)}</p></div>
      </div>
      <div class="dimension-list">
        ${record.dimensionSummary.map((item) => `<div><span>${escapeHtml(item.dimension)} · ${formatDuration(item.durationMinutes)}</span><strong>${item.lifeCoinAmount.toFixed(2)} 元</strong></div>`).join('')}
      </div>
      <div class="activity-list">
        ${record.activities.map((activity) => `<article><div><strong>${escapeHtml(activity.title)}</strong><span>${escapeHtml(activity.dimension)} · ${escapeHtml(activity.domain)}</span></div><p>${formatDuration(activity.durationMinutes)}${activity.estimated ? ' · 估算' : ''}</p></article>`).join('')}
      </div>
      <p class="coin-note">本次记录约覆盖 <strong>${formatCoin(totalMinutes)}</strong> 元人生。</p>
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
      <label class="record-date">记录日期<input name="lifeDate" type="date" max="${todayValue()}" value="${recordLifeDate}" aria-label="记录日期" /></label>
      <textarea name="content" maxlength="2000" rows="4" placeholder="例如：下午专注改了 3 小时 bug，晚上跑步 40 分钟…" required>${escapeHtml(recordDraft)}</textarea>
      <button type="submit" aria-label="交给 AI 整理" ${isAnalyzingRecord ? 'disabled' : ''}>${renderIcon('sparkles')}<span>${isAnalyzingRecord ? '正在整理…' : '交给 AI 整理'}</span></button>
      <p>${escapeHtml(recordMessage)}</p>
    </form>
  `;
}

function renderLife() {
  if (activeTab !== 'life') return '';
  return `
    <section class="screen life-screen">
      <header class="page-heading">
        <h1>人生</h1>
        <p>从真实记录里，看见生活正在发生什么。</p>
        <div class="segmented" aria-label="人生视图">
          <button type="button" data-life-view="insights" class="${activeLifeView === 'insights' ? 'active' : ''}" aria-pressed="${activeLifeView === 'insights'}">洞察</button>
          <button type="button" data-life-view="records" class="${activeLifeView === 'records' ? 'active' : ''}" aria-pressed="${activeLifeView === 'records'}">记录</button>
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

  return `
    <section class="life-view-panel">
      <section class="insight-progress-card">
        <div><p class="eyebrow">第一份阶段回看</p><strong>${recordDates.length >= 7 ? '已生成' : `还差 ${7 - recordDates.length} 个记录日`}</strong></div>
        <div class="progress-track"><i style="width:${progress}%"></i></div>
        <p>按记录日累计，不要求连续打卡。</p>
      </section>

      ${recordDates.length < 3 ? `
        <section class="insight-card gentle">
          <span class="agent-avatar small">${renderIcon('robot')}</span>
          <div><p class="eyebrow">先不急着下结论</p><h2>已经留下 ${recordDates.length} 个记录日</h2><p>至少积累 3 个记录日后，我再开始比较变化，避免用太少的数据定义你的生活。</p></div>
        </section>
      ` : `
        <section class="insight-card">
          <span class="agent-avatar small">${renderIcon('robot')}</span>
          <div><p class="eyebrow">基于最近 ${selectedDates.length} 个记录日</p><h2>${escapeHtml(top.dimension)}是已记录时间中最多的维度</h2><p>这些记录里，${escapeHtml(top.dimension)}约 ${formatDuration(top.durationMinutes)}${second ? `，其次是${escapeHtml(second.dimension)}约 ${formatDuration(second.durationMinutes)}` : ''}。这反映的是你主动记录的片段，不代表完整的 24 小时。</p></div>
        </section>
      `}

      <section class="distribution-card">
        <div class="card-heading"><div><p class="eyebrow">已记录时间占比</p><h2>${selectedDates.length} 个记录日</h2></div><span>共 ${formatDuration(totalMinutes)}</span></div>
        <div class="distribution-list">
          ${dimensions.map((item) => {
            const percent = totalMinutes > 0 ? Math.round((item.durationMinutes / totalMinutes) * 100) : 0;
            return `<div><header><span>${escapeHtml(item.dimension)}</span><strong>${percent}%</strong></header><div><i style="width:${percent}%"></i></div><small>${formatDuration(item.durationMinutes)} · ${item.lifeCoinAmount.toFixed(2)} 元</small></div>`;
          }).join('')}
        </div>
      </section>

      <button type="button" class="text-action" data-life-view="records"><span>查看全部历史记录</span>${renderIcon('chevron')}</button>
    </section>
  `;
}

function renderLifeRecords() {
  if (recentRecords.length === 0) {
    return renderEmptyState('这里会保存你的生活片段', '记录不需要连续，也不需要补齐全天。', '去记录第一条', 'today');
  }

  return `
    <section class="life-view-panel history-panel">
      <div class="section-heading"><div><p class="eyebrow">真实记录</p><h2>${new Set(recentRecords.map((record) => record.lifeDate)).size} 个记录日</h2></div><span>${recentRecords.length} 条</span></div>
      <div class="history-list">
        ${recentRecords.map((record) => `
          <article class="history-card">
            <header><time>${formatLifeDate(record.lifeDate)}</time><span>${record.activities.length} 个生活片段</span></header>
            <p class="history-source">${escapeHtml(record.content)}</p>
            <p class="history-summary">${escapeHtml(record.summary)}</p>
            <div class="history-tags">${record.dimensionSummary.map((item) => `<span>${escapeHtml(item.dimension)} · ${formatDuration(item.durationMinutes)}</span>`).join('')}</div>
            <footer>
              <button type="button" data-agent-record="${record.recordId}">${renderIcon('robot')} Agent 修改</button>
              <button type="button" data-edit-record="${record.recordId}">${renderIcon('edit')} 手动修正</button>
              ${pendingDeleteRecordId === record.recordId
                ? `<button type="button" class="danger" data-delete-record="${record.recordId}" data-delete-action="confirm">确认删除</button><button type="button" data-delete-record="${record.recordId}" data-delete-action="cancel">取消</button>`
                : `<button type="button" class="danger-text" data-delete-record="${record.recordId}" data-delete-action="ask">删除</button>`}
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
  const birthday = account?.birthday ?? '1995-01-01';
  const expectedLifeYears = account?.expectedLifeYears ?? 80;
  const recordDays = new Set(recentRecords.map((record) => record.lifeDate)).size;

  return `
    <section class="screen me-screen">
      <header class="page-heading simple-heading"><h1>我的</h1><p>管理人生余额和保存在本机的数据。</p></header>

      <section class="settings-section account-settings">
        <div class="settings-title"><div><p class="eyebrow">人生账户</p><h2>${account ? '调整余额依据' : '创建人生账户'}</h2></div><span>仅用于估算</span></div>
        <form class="account-form" id="account-form">
          <label><span>${renderIcon('calendar')} 出生日期</span><input name="birthday" type="date" max="${todayValue()}" value="${birthday}" required /></label>
          <label><span>${renderIcon('life')} 预期寿命</span><span class="number-field"><input name="expectedLifeYears" type="number" min="1" max="120" value="${expectedLifeYears}" required /><em>岁</em></span></label>
          <button class="primary-action account-save" type="submit" ${account && !isAccountDirty ? 'disabled' : ''}>${account ? '保存修改' : '生成我的人生余额'}</button>
          <p class="form-message">${escapeHtml(formMessage)}</p>
        </form>
      </section>

      <details class="settings-section privacy-card">
        <summary><span><small>隐私说明</small><strong>当前数据只保存在此浏览器</strong></span>${renderIcon('shield')}</summary>
        <p>这个前端 Demo 不会把生日、记录或反馈发送到后端。清除浏览器数据后将无法恢复，你可以先导出备份。</p>
      </details>

      <section class="settings-section data-card">
        <div class="settings-title"><div><p class="eyebrow">数据管理</p><h2>${recordDays} 个记录日 · ${recentRecords.length} 条记录</h2></div>${renderIcon('database')}</div>
        <div class="data-actions">
          <button type="button" data-export-data>${renderIcon('download')} 导出 JSON</button>
          ${isClearDataConfirming
            ? '<button type="button" class="danger" data-clear-data="confirm">确认清除全部数据</button><button type="button" data-clear-data="cancel">取消</button>'
            : `<button type="button" class="danger-text" data-clear-data="ask">${renderIcon('trash')} 清除数据</button>`}
        </div>
      </section>

      <section class="settings-section feedback-card">
        <div class="settings-title"><div><p class="eyebrow">帮助与反馈</p><h2>这款产品哪里让你困惑？</h2></div>${renderIcon('help')}</div>
        <form id="general-feedback-form">
          <textarea name="feedback" rows="4" maxlength="1000" placeholder="例如：我看不懂人生币，或者我更想看到……" required></textarea>
          <button type="submit" class="primary-action">提交本地反馈</button>
          <p class="form-message">${escapeHtml(feedbackMessage)}${generalFeedback.length > 0 && !feedbackMessage ? `已保存 ${generalFeedback.length} 条反馈。` : ''}</p>
        </form>
      </section>

      <p class="me-version">Life Wallet · H5 Demo v0.3</p>
    </section>
  `;
}

function renderAgentScreen() {
  return `
    <section class="screen agent-screen">
      <header class="agent-page-header">
        <button type="button" data-close-agent aria-label="返回 Today">${renderIcon('back')}</button>
        <div class="agent-page-identity">
          <span>${renderIcon('robot')}</span>
          <div><h1>Life Agent</h1><p>本地 Mock · 只处理生活记录</p></div>
        </div>
        <span class="agent-status" aria-label="当前可用"></span>
      </header>

      <div class="agent-scope-note">我可以查询、新增、修改或删除本机记录。修改和删除都会先展示差异，确认后才执行。</div>

      <section class="agent-conversation" id="agent-conversation" aria-live="polite">
        ${agentMessages.map((message) => `
          <article class="agent-message ${message.role}">
            ${message.role === 'agent' ? `<span class="message-avatar" aria-hidden="true">${renderIcon('robot')}</span>` : ''}
            <div class="message-content"><p>${escapeHtml(message.content)}</p>${message.recordIds ? renderAgentRecordCards(message.recordIds) : ''}</div>
          </article>
        `).join('')}
        ${isAgentThinking ? `<article class="agent-message agent"><span class="message-avatar" aria-hidden="true">${renderIcon('robot')}</span><div class="message-content thinking"><span></span><span></span><span></span></div></article>` : ''}
        ${renderAgentPendingAction()}
      </section>

      ${agentPendingAction || isAgentThinking ? '' : `
        <div class="agent-suggestions" aria-label="对话示例">
          <button type="button" data-agent-prompt="我今天记了什么？">我今天记了什么？</button>
          <button type="button" data-agent-prompt="把今天的上班从 4 小时修改为 8 小时">修改今天的时长</button>
          <button type="button" data-agent-prompt="记下今天散步 30 分钟">记下一段生活</button>
        </div>
      `}

      <form class="agent-composer" id="agent-form">
        <textarea name="message" rows="2" maxlength="2000" placeholder="例如：把今天的上班从 4 小时改成 8 小时…" aria-label="给 Life Agent 发消息" required>${escapeHtml(agentDraft)}</textarea>
        <button type="submit" aria-label="发送给 Life Agent" ${isAgentThinking || agentPendingAction ? 'disabled' : ''}>${renderIcon('send')}</button>
      </form>
    </section>
  `;
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
      formMessage = '';
      render();
      window.scrollTo(0, 0);
    });
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

  document.querySelector<HTMLInputElement>('#record-form input[name="lifeDate"]')?.addEventListener('change', (event) => {
    recordDraft = document.querySelector<HTMLTextAreaElement>('#record-form textarea[name="content"]')?.value ?? recordDraft;
    recordLifeDate = (event.currentTarget as HTMLInputElement).value;
    render();
  });

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

  document.querySelectorAll<HTMLInputElement>('#account-form input').forEach((input) => {
    input.addEventListener('input', () => {
      isAccountDirty = true;
      const saveButton = document.querySelector<HTMLButtonElement>('.account-save');
      if (saveButton) saveButton.disabled = false;
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

function openAgent(recordId: number | null = null) {
  isAgentOpen = true;
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
  const intent = resolveMockAgentIntent(content, orderedRecords, todayValue());

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
  render();
}

async function saveAccount(payload: Pick<Account, 'birthday' | 'expectedLifeYears'>) {
  formMessage = '正在保存...';
  render();
  try {
    account = await saveMockAccount(payload);
    isAccountDirty = false;
    formMessage = '人生账户已保存，可以返回 Today 开始记录。';
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
  formMessage = '本机中的 Life Wallet 数据已清除。';
  render();
}

async function submitGeneralFeedback(content: string) {
  feedbackMessage = '正在保存...';
  render();
  try {
    generalFeedback = await saveMockGeneralFeedback(content);
    feedbackMessage = '感谢反馈，内容已保存在当前浏览器。';
  } catch (error) {
    feedbackMessage = error instanceof Error ? error.message : '保存失败，请稍后再试。';
  }
  render();
}

function renderIcon(name: IconName) {
  // 机器人承担品牌识别，保留定制图形；其余功能图标统一使用 Lucide，避免线宽与造型混乱。
  if (name === 'robot') {
    return '<svg class="icon icon-robot" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3v3"/><circle cx="12" cy="2.8" r="1.2" fill="#45ad69" stroke="none"/><rect x="4" y="6" width="16" height="13" rx="5" fill="#f7fcf8"/><rect x="6.6" y="8.5" width="10.8" height="7.4" rx="2.8" fill="currentColor" stroke="none"/><circle cx="9.8" cy="12.2" r="1" fill="#bff0c8" stroke="none"/><circle cx="14.2" cy="12.2" r="1" fill="#bff0c8" stroke="none"/><path d="M9.5 17.3c1.6.7 3.4.7 5 0"/></svg>';
  }

  const iconNodes: Record<Exclude<IconName, 'robot'>, IconNode> = {
    back: ArrowLeft,
    home: House,
    life: Sprout,
    user: UserRound,
    info: Info,
    send: ArrowUp,
    calendar: CalendarDays,
    edit: PencilLine,
    shield: ShieldCheck,
    database: DatabaseBackup,
    help: CircleQuestionMark,
    download: Download,
    trash: Trash2,
    check: CircleCheck,
    sparkles: Sparkles,
    clock: Clock3,
    heart: HeartHandshake,
    chevron: ChevronRight,
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
  const hours = minutes / 60;
  return Number.isInteger(hours) ? `${hours} 小时` : `${hours.toFixed(1)} 小时`;
}

function formatCoin(minutes: number) {
  return (minutes / LIFE_MINUTES_PER_COIN).toFixed(2);
}

function formatLifeDate(value: string) {
  return new Intl.DateTimeFormat('zh-CN', { month: 'long', day: 'numeric', weekday: 'short' })
    .format(new Date(`${value}T00:00:00`));
}

function formatHeaderDate(date: Date) {
  const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
  return `${date.getMonth() + 1}月${date.getDate()}日 ${weekdays[date.getDay()]}`;
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

render();
void initialize();
