import './styles.css';
import { LIFE_MINUTES_PER_COIN, summarizeDimensions } from './mock/analysis.ts';
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
type IconName = 'home' | 'life' | 'user' | 'info' | 'robot' | 'send' | 'calendar' | 'edit' | 'shield' | 'database' | 'help' | 'download' | 'trash' | 'check';

const app = document.querySelector<HTMLDivElement>('#app');
if (!app) throw new Error('App root element not found');
const appRoot = app;

let activeTab: Tab = 'today';
let activeLifeView: LifeView = 'insights';
let account: Account | null = null;
let recentRecords: TodayRecord[] = [];
let recordFeedback: RecordFeedback[] = [];
let generalFeedback: GeneralFeedback[] = [];
let recordPreview: RecordPreview | null = null;
let editingRecordId: number | null = null;
let pendingDeleteRecordId: number | null = null;
let isAnalyzingRecord = false;
let isWorldviewExpanded = false;
let isLoading = true;
let isClearDataConfirming = false;
let formMessage = '';
let recordMessage = '';
let feedbackMessage = '';
let recordDraft = '';
let recordLifeDate = todayValue();

function render() {
  appRoot.innerHTML = `
    <main class="app-shell">
      <div class="content-scroll">
        ${isLoading ? renderLoading() : `${renderToday()}${renderLife()}${renderMe()}`}
      </div>
      <nav class="tab-bar" aria-label="主导航">
        ${renderTabButton('today', 'home', '今天')}
        ${renderTabButton('life', 'life', '人生')}
        ${renderTabButton('me', 'user', '我的')}
      </nav>
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
  const todayLabel = new Intl.DateTimeFormat('zh-CN', {
    year: 'numeric', month: 'long', day: 'numeric', weekday: 'short',
  }).format(new Date());

  return `
    <section class="screen today-screen">
      <section class="balance-panel">
        <div class="balance-title">
          <p class="eyebrow">人生余额</p>
          <button class="icon-button" type="button" data-worldview-toggle aria-expanded="${isWorldviewExpanded}" aria-label="了解人生余额">${renderIcon('info')}</button>
        </div>
        <h1>${formatNumber(account.remainingLifeDays)}<span> 元</span></h1>
        <p>今天也会花掉 1 元人生</p>
        <p class="date-line">${todayLabel}</p>
        ${isWorldviewExpanded ? '<p class="worldview-explanation">1 天 = 1 元人生，24 小时共同组成这 1 元。记录不是为了补齐每一分钟，而是帮助你看见那些值得回看的生活片段。</p>' : ''}
      </section>

      <section class="agent-panel">
        <div class="agent-avatar" aria-hidden="true">${renderIcon('robot')}</div>
        <div class="agent-bubble">
          <p>${dayRecords.length > 0 ? `这一天已经记录了 ${dayRecords.length} 个片段，还想补充什么？` : '今天这一元，哪些片段值得记住？'}</p>
          <small>不用分类，也不用精确到分钟，像发消息一样告诉我。</small>
        </div>
      </section>

      <section class="quick-record" aria-label="表达提示">
        <p>不知道怎么开始？</p>
        <div>
          <button type="button" data-quick-prompt="今天主要做了">今天主要做了…</button>
          <button type="button" data-quick-prompt="最花时间的是">最花时间的是…</button>
          <button type="button" data-quick-prompt="今天让我感觉">今天让我感觉…</button>
        </div>
      </section>

      ${renderSubmittedRecordBubble()}
      ${isAnalyzingRecord ? renderAgentMessage('我正在整理这段记录。完成后请你确认活动和估算时长是否准确。') : ''}
      ${renderRecordPreview()}
      ${renderDayRecords(dayRecords)}
      ${renderComposer()}
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
    <section class="day-records">
      <div class="section-heading"><div><p class="eyebrow">${recordLifeDate === todayValue() ? '今天' : formatLifeDate(recordLifeDate)}</p><h2>已确认的生活片段</h2></div><span>${records.length} 条</span></div>
      ${records.map(renderSavedRecord).join('')}
    </section>
  `;
}

function renderSavedRecord(record: TodayRecord) {
  const feedback = recordFeedback.find((item) => item.recordId === record.recordId)?.rating;
  const totalMinutes = record.dimensionSummary.reduce((sum, item) => sum + item.durationMinutes, 0);
  return `
    <article class="saved-record-card">
      <div class="saved-source"><p>${escapeHtml(record.content)}</p><button type="button" data-edit-record="${record.recordId}">${renderIcon('edit')} 修正</button></div>
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
      <textarea name="content" maxlength="2000" rows="3" placeholder="例如：上午开会，下午改了 3 小时 bug，晚上跑步 40 分钟，有点累…" required>${escapeHtml(recordDraft)}</textarea>
      <button type="submit" aria-label="发送记录" ${isAnalyzingRecord ? 'disabled' : ''}>${renderIcon('send')}</button>
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

      <button type="button" class="text-action" data-life-view="records">查看全部历史记录</button>
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
              <button type="button" data-edit-record="${record.recordId}">${renderIcon('edit')} 修正记录</button>
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
          <button class="primary-action" type="submit">${account ? '保存修改' : '生成我的人生余额'}</button>
          <p class="form-message">${escapeHtml(formMessage)}</p>
        </form>
      </section>

      <section class="settings-section privacy-card">
        <div class="settings-title"><div><p class="eyebrow">隐私说明</p><h2>当前数据只保存在此浏览器</h2></div>${renderIcon('shield')}</div>
        <p>这个前端 Demo 不会把生日、记录或反馈发送到后端。清除浏览器数据后将无法恢复，你可以先导出备份。</p>
      </section>

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

      <p class="me-version">Life Wallet · H5 Demo v0.2</p>
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

  document.querySelector<HTMLButtonElement>('[data-export-data]')?.addEventListener('click', () => void exportData());
  document.querySelectorAll<HTMLButtonElement>('[data-clear-data]').forEach((button) => {
    button.addEventListener('click', () => void handleClearData(button.dataset.clearData ?? 'ask'));
  });

  document.querySelector<HTMLFormElement>('#general-feedback-form')?.addEventListener('submit', (event) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget as HTMLFormElement);
    void submitGeneralFeedback(String(formData.get('feedback') ?? ''));
  });
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
    recentRecords = [saved, ...recentRecords.filter((record) => record.recordId !== saved.recordId)]
      .sort((a, b) => b.lifeDate.localeCompare(a.lifeDate) || b.createdAt.localeCompare(a.createdAt));
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
  window.scrollTo(0, document.body.scrollHeight);
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
  const paths: Record<IconName, string> = {
    home: '<path d="M3.5 10.5 12 3.7l8.5 6.8"/><path d="M5.8 9.3v10h12.4v-10"/><path d="M9.5 19.3v-5.5h5v5.5"/>',
    life: '<path d="M12 20v-7"/><path d="M12 13c-4.1 0-7-2.2-7-6.6 4.7 0 7 2.3 7 6.6Z"/><path d="M12 16c4.1 0 7-2.2 7-6.6-4.7 0-7 2.3-7 6.6Z"/><path d="M7.5 20h9"/>',
    user: '<circle cx="12" cy="8" r="3.2"/><path d="M5.5 20c.4-4.3 2.6-6.5 6.5-6.5s6.1 2.2 6.5 6.5"/>',
    info: '<circle cx="12" cy="12" r="9"/><path d="M12 10.8v5.4"/><path d="M12 7.5h.01"/>',
    robot: '<rect x="4" y="6.5" width="16" height="12" rx="4"/><path d="M12 3v3.5"/><circle cx="12" cy="2.8" r="1"/><circle cx="9" cy="12" r="1.2"/><circle cx="15" cy="12" r="1.2"/><path d="M9.2 15.3c1.8 1 3.8 1 5.6 0"/>',
    send: '<path d="m6 12 6-6 6 6"/><path d="M12 6v12"/>',
    calendar: '<rect x="3" y="5" width="18" height="16" rx="3"/><path d="M8 3v4M16 3v4M3 10h18"/>',
    edit: '<path d="M4 20h4l11-11-4-4L4 16v4Z"/><path d="m13.5 6.5 4 4"/>',
    shield: '<path d="M12 3 5 6v5c0 4.6 2.7 8 7 10 4.3-2 7-5.4 7-10V6l-7-3Z"/><path d="m9 12 2 2 4-4"/>',
    database: '<ellipse cx="12" cy="5" rx="8" ry="3"/><path d="M4 5v12c0 1.7 3.6 3 8 3s8-1.3 8-3V5M4 11c0 1.7 3.6 3 8 3s8-1.3 8-3"/>',
    help: '<circle cx="12" cy="12" r="9"/><path d="M9.8 9a2.4 2.4 0 0 1 4.7.7c0 1.8-2.5 2-2.5 4"/><path d="M12 17.2h.01"/>',
    download: '<path d="M12 3v12m0 0 4-4m-4 4-4-4"/><path d="M5 19h14"/>',
    trash: '<path d="M4 7h16M9 7V4h6v3m3 0-1 14H7L6 7"/><path d="M10 11v6M14 11v6"/>',
    check: '<circle cx="12" cy="12" r="9"/><path d="m8 12 2.6 2.6L16.5 9"/>',
  };
  return `<svg class="icon icon-${name}" viewBox="0 0 24 24" aria-hidden="true">${paths[name]}</svg>`;
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
