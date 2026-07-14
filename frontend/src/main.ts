import './styles.css';
import {
  confirmMockRecord,
  getMockAccount,
  getMockRecentRecords,
  getMockTodayRecord,
  previewMockRecord,
  saveMockAccount,
  type Account,
  type RecordPreview,
  type TodayRecord,
} from './mock/data';

type Tab = 'today' | 'life' | 'me';
type LifeView = 'overview' | 'trend' | 'timeline' | 'achievements';
type IconName = 'home' | 'life' | 'user' | 'info' | 'robot' | 'send' | 'calendar' | 'chevron' | 'award' | 'flame' | 'trend' | 'clock' | 'check' | 'sparkles' | 'bell' | 'shield' | 'database' | 'help' | 'edit';

const accountStorageKey = 'life-wallet-account';

const app = document.querySelector<HTMLDivElement>('#app');

if (!app) {
  throw new Error('App root element not found');
}

const appRoot = app;

let activeTab: Tab = 'today';
let activeLifeView: LifeView = 'overview';
let account: Account | null = readAccount();
let todayRecord: TodayRecord | null = null;
let recentRecords: TodayRecord[] = [];
let recordPreview: RecordPreview | null = null;
let isAnalyzingRecord = false;
let isWorldviewExpanded = false;
let formMessage = '';
let recordMessage = '';
let recordDraft = '';
let isAgentReminderEnabled = true;

// 前端第一版先用很轻的全局状态驱动页面，便于快速验证 Today / Life / Me 三个 Tab。
// 后续如果页面复杂起来，再考虑引入正式状态管理。
function formatNumber(value: number | null | undefined) {
  if (value === null || value === undefined) {
    return '--';
  }

  return new Intl.NumberFormat('zh-CN').format(value);
}

function escapeHtml(value: string) {
  // 用户记录会原样展示在页面上，必须先转义，避免输入内容被当成 HTML 执行。
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function getTodayDateValue() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

function readAccount() {
  // 后端当前还是内存存储，前端也缓存一份账户信息，让刷新后的体验更连续。
  const raw = localStorage.getItem(accountStorageKey);

  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as Account;
  } catch {
    localStorage.removeItem(accountStorageKey);
    return null;
  }
}

function persistAccount(nextAccount: Account) {
  account = nextAccount;
  localStorage.setItem(accountStorageKey, JSON.stringify(nextAccount));
}

function renderIcon(name: IconName) {
  const content = {
    home: '<path d="M3.5 10.5 12 3.7l8.5 6.8"/><path d="M5.8 9.3v10h12.4v-10"/><path d="M9.5 19.3v-5.5h5v5.5"/>',
    life: '<path d="M12 20v-7"/><path d="M12 13c-4.1 0-7-2.2-7-6.6 4.7 0 7 2.3 7 6.6Z"/><path d="M12 16c4.1 0 7-2.2 7-6.6-4.7 0-7 2.3-7 6.6Z"/><path d="M7.5 20h9"/>',
    user: '<circle cx="12" cy="8" r="3.2"/><path d="M5.5 20c.4-4.3 2.6-6.5 6.5-6.5s6.1 2.2 6.5 6.5"/>',
    info: '<circle cx="12" cy="12" r="9"/><path d="M12 10.8v5.4"/><path d="M12 7.5h.01"/>',
    robot: '<rect x="4" y="6.5" width="16" height="12" rx="4"/><path d="M12 3v3.5"/><circle cx="12" cy="2.8" r="1"/><circle cx="9" cy="12" r="1.2"/><circle cx="15" cy="12" r="1.2"/><path d="M9.2 15.3c1.8 1 3.8 1 5.6 0"/><path d="M4 11H2.5M21.5 11H20"/>',
    send: '<path d="m6 12 6-6 6 6"/><path d="M12 6v12"/>',
    calendar: '<rect x="3" y="5" width="18" height="16" rx="3"/><path d="M8 3v4M16 3v4M3 10h18"/><path d="M8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01"/>',
    chevron: '<path d="m9 18 6-6-6-6"/>',
    award: '<circle cx="12" cy="9" r="5"/><path d="m8.5 13-1 8 4.5-2 4.5 2-1-8"/><path d="m12 6 .8 1.6 1.7.3-1.2 1.2.3 1.8-1.6-.8-1.6.8.3-1.8-1.2-1.2 1.7-.3L12 6Z"/>',
    flame: '<path d="M12 22c4.2 0 7-2.8 7-7 0-3.2-1.8-6.3-5.3-9.3.2 2.6-1 4-2.3 4.8.1-3.8-2-6-3.6-7.5.1 3.5-2.8 5.7-2.8 10.4C5 18.5 8 22 12 22Z"/><path d="M12 19c1.8 0 3-1.3 3-3.2 0-1.5-.8-2.7-2-3.8-.2 1.2-.8 1.9-1.5 2.3-.1-1.4-.8-2.4-1.6-3.1-.1 1.6-.9 2.6-.9 4.3 0 2.1 1.2 3.5 3 3.5Z"/>',
    trend: '<path d="M3 18 9 12l4 4 8-10"/><path d="M15 6h6v6"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3.5 2"/>',
    check: '<circle cx="12" cy="12" r="9"/><path d="m8 12 2.6 2.6L16.5 9"/>',
    sparkles: '<path d="m12 3 1.3 3.7L17 8l-3.7 1.3L12 13l-1.3-3.7L7 8l3.7-1.3L12 3Z"/><path d="m18.5 14 .8 2.2 2.2.8-2.2.8-.8 2.2-.8-2.2-2.2-.8 2.2-.8.8-2.2Z"/><path d="m5 13 .7 1.8 1.8.7-1.8.7L5 18l-.7-1.8-1.8-.7 1.8-.7L5 13Z"/>',
    bell: '<path d="M5 17h14l-1.6-2.2V10a5.4 5.4 0 0 0-10.8 0v4.8L5 17Z"/><path d="M10 20h4"/>',
    shield: '<path d="M12 3 5 6v5c0 4.6 2.7 8 7 10 4.3-2 7-5.4 7-10V6l-7-3Z"/><path d="m9 12 2 2 4-4"/>',
    database: '<ellipse cx="12" cy="5" rx="8" ry="3"/><path d="M4 5v6c0 1.7 3.6 3 8 3s8-1.3 8-3V5"/><path d="M4 11v6c0 1.7 3.6 3 8 3s8-1.3 8-3v-6"/>',
    help: '<circle cx="12" cy="12" r="9"/><path d="M9.8 9a2.4 2.4 0 0 1 4.7.7c0 1.8-2.5 2-2.5 4"/><path d="M12 17.2h.01"/>',
    edit: '<path d="M4 20h4l11-11-4-4L4 16v4Z"/><path d="m13.5 6.5 4 4"/>',
  }[name];

  return `<svg class="icon icon-${name}" viewBox="0 0 24 24" aria-hidden="true">${content}</svg>`;
}

function render() {
  // 这个 Demo 用模板字符串直接渲染整屏，优势是改 UI 很快；
  // 每次 render 后重新绑定事件，保持实现简单可读。
  appRoot.innerHTML = `
    <main class="app-shell">
      <div class="content-scroll">
        ${renderToday()}
        ${renderLife()}
        ${renderMe()}
      </div>

      <nav class="tab-bar" aria-label="主导航">
        <button data-tab="today" class="${activeTab === 'today' ? 'active' : ''}"><span class="tab-icon">${renderIcon('home')}</span><span>今天</span></button>
        <button data-tab="life" class="${activeTab === 'life' ? 'active' : ''}"><span class="tab-icon">${renderIcon('life')}</span><span>人生</span></button>
        <button data-tab="me" class="${activeTab === 'me' ? 'active' : ''}"><span class="tab-icon">${renderIcon('user')}</span><span>我的</span></button>
      </nav>
    </main>
  `;

  bindEvents();
}

function renderToday() {
  if (activeTab !== 'today') {
    return '';
  }

  const remaining = account ? formatNumber(account.remainingLifeDays) : '--';
  const todayLabel = new Intl.DateTimeFormat('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'short',
  }).format(new Date());

  // Today 是 Agent First 的首页：先展示人生余额，再让用户直接和 Agent 记录今天。
  return `
    <section class="screen today-screen">
      <section class="balance-panel">
        <div class="balance-title">
          <p class="eyebrow">人生余额</p>
          <button class="worldview-toggle" type="button" data-worldview-toggle aria-expanded="${isWorldviewExpanded}" aria-label="了解人生余额">${renderIcon('info')}</button>
        </div>
        <h1>${remaining}<span> 元</span></h1>
        <p>今天也会花掉 1 元人生</p>
        <p class="date-line">${todayLabel}</p>
        ${isWorldviewExpanded ? '<p class="worldview-explanation">1 天 = 1 元人生。它不是积分，而是把有限时间变得更容易看见：每一天都会消耗，记录帮助你理解它花在了哪里。</p>' : ''}
      </section>

      <section class="agent-panel">
        <div class="agent-avatar" aria-hidden="true">${renderIcon('robot')}</div>
        <div class="agent-bubble">
          <p>嗨，我是你的人生助手</p>
          <p>今天这一元，花去哪了？</p>
        </div>
      </section>

      <section class="quick-record">
        <p>快速记录</p>
        <div>
          <button type="button" data-quick-record="工作">工作</button>
          <button type="button" data-quick-record="学习">学习</button>
          <button type="button" data-quick-record="生活">生活</button>
          <button type="button" data-quick-record="放松">放松</button>
          <button type="button" data-quick-record="其他">其他</button>
        </div>
      </section>

      ${renderSubmittedRecordBubble()}
      ${isAnalyzingRecord ? renderAgentMessage('我正在理解你的记录，理解完成后会生成今日账单，请确认是否准确。') : ''}
      ${renderRecordPreview()}
      ${renderTodayRecord()}

      ${renderComposer()}
    </section>
  `;
}

function renderSubmittedRecordBubble() {
  if ((!isAnalyzingRecord && !recordPreview) || !recordDraft) {
    return '';
  }

  return `<section class="user-bubble"><p>${escapeHtml(recordDraft)}</p></section>`;
}

function renderAgentMessage(message: string) {
  return `
    <section class="agent-panel processing-message">
      <div class="agent-avatar" aria-hidden="true">${renderIcon('robot')}</div>
      <div class="agent-bubble muted"><p>${message}</p></div>
    </section>
  `;
}

function renderTodayRecord() {
  if (!todayRecord) {
    return '';
  }

  // AI 理解结果分三块展示：一句总结、维度汇总、具体 Activity。
  // 这对应后端 AgentAnalysis 的结构，也方便用户检查“像不像我的一天”。
  return `
    <section class="saved-record">
      <p class="eyebrow">今日记录</p>
      <p>${escapeHtml(todayRecord.content)}</p>
      <span>Record #${todayRecord.recordId} · ${todayRecord.status}</span>
    </section>

    <section class="analysis-card">
      <div class="analysis-heading">
        <div class="agent-avatar small" aria-hidden="true">${renderIcon('robot')}</div>
        <div>
          <p class="eyebrow">我理解的是</p>
          <p>${escapeHtml(todayRecord.summary)}</p>
        </div>
      </div>

      <div class="dimension-list">
        ${todayRecord.dimensionSummary.map((item) => `
          <div>
            <span>${escapeHtml(item.dimension)}</span>
            <strong>${formatDuration(item.durationMinutes)} · ${item.lifeCoinAmount.toFixed(2)} 元</strong>
          </div>
        `).join('')}
      </div>

      <div class="activity-list">
        ${todayRecord.activities.map((activity) => `
          <article>
            <div>
              <strong>${escapeHtml(activity.title)}</strong>
              <span>${escapeHtml(activity.dimension)} · ${escapeHtml(activity.domain)}</span>
            </div>
            <p>${formatDuration(activity.durationMinutes)}${activity.estimated ? ' 估算' : ''}</p>
          </article>
        `).join('')}
      </div>

      <p class="confirmation-note">
        ${todayRecord.needsConfirmation ? '包含估算时间，后续可继续调整。' : '记录中的时间信息较明确。'}
      </p>
    </section>
  `;
}

function renderRecordPreview() {
  if (!recordPreview) {
    return '';
  }

  return `
    <section class="record-preview">
      <p class="eyebrow">AI 解析预览</p>
      <div class="preview-activities">
        ${recordPreview.activities.map((activity) => `
          <article>
            <span>${escapeHtml(activity.dimension)} · ${escapeHtml(activity.domain)}</span>
            <strong>${escapeHtml(activity.title)}</strong>
            <em>约 ${formatDuration(activity.durationMinutes)}</em>
          </article>
        `).join('')}
      </div>
      ${recordPreview.stateDescription ? `<p class="state-line">${escapeHtml(recordPreview.stateDescription)}</p>` : ''}
      <div class="preview-summary">
        <span>AI 今日总结</span>
        <p>${escapeHtml(recordPreview.summary)}</p>
      </div>
      <p class="preview-dimensions">涉及维度：${recordPreview.dimensionSummary.map((item) => escapeHtml(item.dimension)).join('、')}</p>
      <div class="preview-actions">
        <p>以上理解是否准确？</p>
        <button type="button" class="secondary-action" data-preview-action="modify">需要修改</button>
        <button type="button" class="primary-action compact" data-preview-action="confirm">确认并保存</button>
      </div>
    </section>
  `;
}

function formatDuration(minutes: number) {
  if (minutes < 60) {
    return `${minutes} 分钟`;
  }

  const hours = minutes / 60;
  return Number.isInteger(hours) ? `${hours} 小时` : `${hours.toFixed(1)} 小时`;
}

function renderComposer() {
  if (!account) {
    return `
      <div class="composer">
        <span>先设置生日和预期寿命...</span>
        <button data-tab="me" aria-label="创建账户">${renderIcon('send')}</button>
      </div>
    `;
  }

  return `
    <form class="composer" id="record-form">
      <input
        name="content"
        maxlength="2000"
        placeholder="说说今天的经历吧..."
        value="${escapeHtml(recordDraft)}"
        required
      />
      <button type="submit" aria-label="保存今日记录">${renderIcon('send')}</button>
      <p>${escapeHtml(recordMessage)}</p>
    </form>
  `;
}

function renderLife() {
  if (activeTab !== 'life') {
    return '';
  }

  const views: Array<{ value: LifeView; label: string }> = [
    { value: 'overview', label: '概览' },
    { value: 'trend', label: '趋势' },
    { value: 'timeline', label: '时间轴' },
    { value: 'achievements', label: '成就' },
  ];

  return `
    <section class="screen life-screen">
      <section class="page-heading">
        <div class="life-title-row">
          <span aria-hidden="true"></span>
          <h1>人生</h1>
          <button type="button" class="calendar-button" aria-label="选择日期">${renderIcon('calendar')}</button>
        </div>
        <div class="segmented">
          ${views.map((view) => `<button type="button" data-life-view="${view.value}" class="${activeLifeView === view.value ? 'active' : ''}">${view.label}</button>`).join('')}
        </div>
      </section>

      ${renderLifeView()}
    </section>
  `;
}

function renderLifeView() {
  if (activeLifeView === 'trend') return renderLifeTrend();
  if (activeLifeView === 'timeline') return renderLifeTimeline();
  if (activeLifeView === 'achievements') return renderLifeAchievements();
  return renderLifeOverview();
}

function renderLifeOverview() {
  return `
    <section class="life-view-panel">

      <section class="life-balance-card">
        <p class="eyebrow">人生余额</p>
        <div>
          <strong>${formatNumber(account?.remainingLifeDays)}<span> 元</span></strong>
          <svg viewBox="0 0 160 78" role="img" aria-label="人生余额趋势">
            <polyline points="8,16 34,22 60,30 86,38 112,50 148,64" />
            <circle cx="8" cy="16" r="3" />
            <circle cx="148" cy="64" r="3" />
          </svg>
        </div>
        <p>已消耗 ${formatNumber(account?.usedLifeDays)} 天</p>
      </section>

      <section class="dimension-overview-card">
        <h2>维度分布 <span>（近 30 天）</span></h2>
        <div class="dimension-overview-content">
          <div class="dimension-donut" role="img" aria-label="近 30 天人生维度分布">
            <div><span>30天记录</span><strong>128 条</strong></div>
          </div>
          <div class="dimension-legend">
            <div><i class="work"></i><span>工作</span><strong>42%</strong></div>
            <div><i class="growth"></i><span>成长</span><strong>25%</strong></div>
            <div><i class="life"></i><span>生活</span><strong>16%</strong></div>
            <div><i class="health"></i><span>健康</span><strong>10%</strong></div>
            <div><i class="relation"></i><span>关系</span><strong>7%</strong></div>
          </div>
        </div>
      </section>

      <section class="life-insight-card">
        <h2>AI 洞察</h2>
        <p>近 30 天，你的工作投入较高，成长维度有所提升，建议保持学习节奏，适当增加休息与运动。</p>
        <button type="button">查看完整洞察 ${renderIcon('chevron')}</button>
      </section>

      <section class="achievement-section">
        <h2>最近的成就</h2>
        <div>
          <article>
            <span class="achievement-icon streak">${renderIcon('flame')}</span>
            <p><strong>连续记录 7 天</strong><small>坚持就是胜利！</small></p>
          </article>
          <article>
            <span class="achievement-icon growth">${renderIcon('award')}</span>
            <p><strong>学习达人</strong><small>本周学习 5 次</small></p>
          </article>
        </div>
      </section>

      ${recentRecords.length > 0 ? `
        <section class="recent-records life-history">
          <div class="section-heading"><div><p class="eyebrow">最近记录</p><h2>人生账单</h2></div><span>${recentRecords.length} 条</span></div>
          ${renderRecentRecords()}
        </section>
      ` : ''}
    </section>
  `;
}

function renderLifeTrend() {
  return `
    <section class="life-view-panel">
      <div class="life-view-heading"><div><h2>近 30 天趋势</h2><p>看见生活投入的变化方向</p></div><span>6月12日 - 7月11日</span></div>

      <section class="trend-summary-grid">
        <article><span>工作</span><strong>42%</strong><small class="up">↑ 4%</small></article>
        <article><span>成长</span><strong>25%</strong><small class="up">↑ 6%</small></article>
        <article><span>休闲</span><strong>18%</strong><small class="down">↓ 2%</small></article>
      </section>

      <section class="trend-chart-card">
        <header><div><h3>维度趋势</h3><p>按周查看投入占比</p></div><span>${renderIcon('trend')}</span></header>
        <svg viewBox="0 0 360 190" role="img" aria-label="近30天人生维度趋势折线图">
          <g class="chart-grid"><path d="M36 26H340M36 66H340M36 106H340M36 146H340"/></g>
          <path class="trend-line work" d="M36 82 C82 62 102 72 140 58 S210 48 244 36 S300 45 340 28"/>
          <path class="trend-line growth" d="M36 132 C78 128 104 116 140 120 S208 92 244 96 S304 72 340 76"/>
          <path class="trend-line leisure" d="M36 110 C82 104 108 92 140 98 S208 118 244 112 S306 122 340 116"/>
          <g class="chart-axis"><text x="36" y="174">第1周</text><text x="126" y="174">第2周</text><text x="218" y="174">第3周</text><text x="310" y="174">本周</text></g>
        </svg>
        <div class="trend-legend"><span><i class="work"></i>工作</span><span><i class="growth"></i>成长</span><span><i class="leisure"></i>休闲</span></div>
      </section>

      <section class="trend-insight">
        <span>${renderIcon('robot')}</span>
        <div><strong>趋势洞察</strong><p>你的成长投入连续三周上升，同时休闲时间保持稳定，这是一个健康的调整信号。</p></div>
      </section>
    </section>
  `;
}

function renderLifeTimeline() {
  return `
    <section class="life-view-panel">
      <div class="life-view-heading"><div><h2>人生时间轴</h2><p>按发生时间回看生活片段</p></div><span>共 128 条</span></div>
      <div class="timeline-filters"><button class="active">全部</button><button>工作</button><button>成长</button><button>生活</button></div>

      <section class="timeline-list">
        <article class="timeline-day">
          <header><time>7月11日</time><span>今天 · 3 条</span></header>
          <div class="timeline-event work"><i></i><div><span>09:30</span><strong>完成核心模块改造</strong><p>工作 · 创造 · 约 8 小时</p></div></div>
          <div class="timeline-event growth"><i></i><div><span>21:10</span><strong>英语口语练习</strong><p>学习 · 成长 · 40 分钟</p></div></div>
          <div class="timeline-event state"><i></i><div><span>22:20</span><strong>状态有点累</strong><p>状态 · 中等消耗</p></div></div>
        </article>
        <article class="timeline-day">
          <header><time>7月10日</time><span>昨天 · 2 条</span></header>
          <div class="timeline-event health"><i></i><div><span>07:40</span><strong>晨间跑步</strong><p>运动 · 健康 · 35 分钟</p></div></div>
          <div class="timeline-event relation"><i></i><div><span>19:30</span><strong>和朋友吃晚饭</strong><p>朋友 · 关系 · 2 小时</p></div></div>
        </article>
        <article class="timeline-day">
          <header><time>7月9日</time><span>2 天前 · 1 条</span></header>
          <div class="timeline-event leisure"><i></i><div><span>20:15</span><strong>看了一部电影</strong><p>放松 · 休闲 · 2 小时</p></div></div>
        </article>
      </section>
    </section>
  `;
}

function renderLifeAchievements() {
  return `
    <section class="life-view-panel">
      <section class="achievement-hero">
        <span>${renderIcon('award')}</span>
        <div><p>已解锁成就</p><strong>8 <small>/ 12</small></strong></div>
        <div class="achievement-progress"><i style="width: 67%"></i></div>
      </section>

      <div class="life-view-heading achievement-heading"><div><h2>我的成就</h2><p>持续记录，逐渐看见完整的自己</p></div><span>完成度 67%</span></div>
      <section class="achievement-grid">
        <article class="unlocked"><span class="streak">${renderIcon('flame')}</span><strong>初次记录</strong><p>完成第一条人生记录</p><small>7月1日解锁</small></article>
        <article class="unlocked"><span class="growth">${renderIcon('award')}</span><strong>连续记录 7 天</strong><p>连续七个记录日完成复盘</p><small>7月7日解锁</small></article>
        <article class="unlocked"><span class="balance">${renderIcon('check')}</span><strong>生活观察者</strong><p>累计记录 100 个生活片段</p><small>7月10日解锁</small></article>
        <article class="unlocked"><span class="learning">${renderIcon('trend')}</span><strong>学习达人</strong><p>单周完成 5 次成长投入</p><small>7月11日解锁</small></article>
        <article class="locked"><span>${renderIcon('clock')}</span><strong>坚持 30 天</strong><p>连续记录 30 个记录日</p><small>进度 7 / 30</small></article>
        <article class="locked"><span>${renderIcon('life')}</span><strong>多彩人生</strong><p>单周覆盖全部人生维度</p><small>进度 5 / 7</small></article>
      </section>
    </section>
  `;
}

function renderRecentRecords() {
  if (recentRecords.length === 0) {
    return '<p class="recent-empty">还没有可回看的记录。先在 Today 告诉我今天发生了什么吧。</p>';
  }

  return `
    <div class="recent-record-list">
      ${recentRecords.map((record) => `
        <article>
          <div class="recent-record-heading">
            <strong>${formatLifeDate(record.lifeDate)}</strong>
            <span>${record.dimensionSummary.map((item) => escapeHtml(item.dimension)).join(' · ') || '人生记录'}</span>
          </div>
          <p>${escapeHtml(record.summary)}</p>
          <small>${record.activities.length} 个生活片段 · ${record.dimensionSummary.map((item) => `${item.lifeCoinAmount.toFixed(2)} 元`).join(' / ')}</small>
        </article>
      `).join('')}
    </div>
  `;
}

function formatLifeDate(value: string) {
  return new Intl.DateTimeFormat('zh-CN', { month: 'long', day: 'numeric', weekday: 'short' })
    .format(new Date(`${value}T00:00:00`));
}

function renderMe() {
  if (activeTab !== 'me') {
    return '';
  }

  const birthday = account?.birthday ?? '1995-01-01';
  const expectedLifeYears = account?.expectedLifeYears ?? 80;
  const remaining = account?.remainingLifeDays ?? 28652;
  const age = Math.max(0, new Date().getFullYear() - Number(birthday.slice(0, 4)));

  return `
    <section class="screen me-screen">
      <header class="me-header">
        <h1>我的</h1>
      </header>

      <section class="profile-card">
        <div class="profile-avatar" aria-hidden="true">人</div>
        <div class="profile-copy">
          <div class="profile-name-row">
            <h2>人生体验者</h2>
            <span>体验版</span>
          </div>
          <p>已陪你记录生活的第 7 天</p>
        </div>
        <button class="profile-edit" type="button" data-focus-account aria-label="编辑人生账户">${renderIcon('edit')}</button>
      </section>

      <section class="me-stats" aria-label="人生数据摘要">
        <div><strong>${remaining.toLocaleString('zh-CN')}</strong><span>人生余额</span></div>
        <div><strong>${Math.max(recentRecords.length, 7)}</strong><span>记录天数</span></div>
        <div><strong>8</strong><span>已获成就</span></div>
      </section>

      <section class="settings-section account-settings" id="account-settings">
        <div class="settings-title"><h2>人生账户</h2><span>用于计算人生余额</span></div>
        <form class="mini-account-form" id="account-form">
          <label class="setting-row">
            <span class="setting-icon green">${renderIcon('calendar')}</span>
            <span class="setting-copy"><strong>出生日期</strong><small>当前约 ${age} 岁</small></span>
            <input name="birthday" type="date" value="${birthday}" aria-label="出生日期" required />
          </label>
          <label class="setting-row">
            <span class="setting-icon amber">${renderIcon('life')}</span>
            <span class="setting-copy"><strong>预期寿命</strong><small>仅用于余额估算</small></span>
            <span class="number-field"><input name="expectedLifeYears" type="number" min="1" max="120" value="${expectedLifeYears}" aria-label="预期寿命" required /><em>岁</em></span>
          </label>
          <button class="me-save-button" type="submit">保存人生账户</button>
          <p class="form-message" id="form-message">${formMessage}</p>
        </form>
      </section>

      <section class="settings-section">
        <div class="settings-title"><h2>AI 助手</h2></div>
        <div class="setting-row static-row">
          <span class="setting-icon violet">${renderIcon('sparkles')}</span>
          <span class="setting-copy"><strong>理解偏好</strong><small>温和总结 · 自动归类</small></span>
          <span class="setting-value">默认</span>
        </div>
        <label class="setting-row switch-row">
          <span class="setting-icon blue">${renderIcon('bell')}</span>
          <span class="setting-copy"><strong>记录提醒</strong><small>每天 21:30 温和提醒</small></span>
          <input class="mini-switch" type="checkbox" data-agent-reminder ${isAgentReminderEnabled ? 'checked' : ''} aria-label="记录提醒" />
        </label>
      </section>

      <section class="settings-section">
        <div class="settings-title"><h2>数据与服务</h2></div>
        ${renderMeActionRow('shield', '隐私与安全', '数据仅用于生成你的个人洞察', 'privacy')}
        ${renderMeActionRow('database', '数据管理', '查看与管理本地记录', 'data')}
        ${renderMeActionRow('help', '帮助与反馈', '告诉我们你的使用感受', 'help')}
      </section>

      <p class="me-version">Life Wallet · H5 Demo v0.1</p>
    </section>
  `;
}

function renderMeActionRow(icon: IconName, title: string, description: string, action: string) {
  return `
    <button class="setting-row action-row" type="button" data-me-action="${action}">
      <span class="setting-icon neutral">${renderIcon(icon)}</span>
      <span class="setting-copy"><strong>${title}</strong><small>${description}</small></span>
      <span class="setting-chevron">${renderIcon('chevron')}</span>
    </button>
  `;
}

function bindEvents() {
  // 页面是整屏重渲染，所以所有事件绑定都集中在这里，避免散落在各个 render 函数里。
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

  document.querySelector<HTMLButtonElement>('[data-focus-account]')?.addEventListener('click', () => {
    document.querySelector<HTMLElement>('#account-settings')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    window.setTimeout(() => document.querySelector<HTMLInputElement>('#account-form input')?.focus(), 350);
  });

  document.querySelector<HTMLInputElement>('[data-agent-reminder]')?.addEventListener('change', (event) => {
    isAgentReminderEnabled = (event.currentTarget as HTMLInputElement).checked;
    formMessage = isAgentReminderEnabled ? '已开启每日记录提醒。' : '已关闭记录提醒。';
    render();
  });

  document.querySelectorAll<HTMLButtonElement>('[data-me-action]').forEach((button) => {
    button.addEventListener('click', () => {
      const labels: Record<string, string> = { privacy: '隐私与安全', data: '数据管理', help: '帮助与反馈' };
      formMessage = `${labels[button.dataset.meAction ?? ''] ?? '该功能'}将在后续版本开放。`;
      render();
      document.querySelector<HTMLElement>('#account-settings')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });
  });

  document.querySelectorAll<HTMLButtonElement>('[data-quick-record]').forEach((button) => {
    button.addEventListener('click', () => {
      // 快捷标签只降低输入门槛，不替用户决定分类；用户仍可直接补充完整自然语言记录。
      recordDraft = button.dataset.quickRecord ?? '';
      render();
      document.querySelector<HTMLInputElement>('#record-form input[name="content"]')?.focus();
    });
  });

  document.querySelector<HTMLButtonElement>('[data-worldview-toggle]')?.addEventListener('click', () => {
    isWorldviewExpanded = !isWorldviewExpanded;
    render();
  });

  document.querySelectorAll<HTMLButtonElement>('[data-preview-action]').forEach((button) => {
    button.addEventListener('click', () => {
      if (button.dataset.previewAction === 'modify') {
        modifyPreview();
        return;
      }
      void confirmPreview();
    });
  });

  document.querySelector<HTMLFormElement>('#account-form')?.addEventListener('submit', async (event) => {
    event.preventDefault();

    const form = event.currentTarget as HTMLFormElement;
    const formData = new FormData(form);
    const birthday = String(formData.get('birthday') ?? '');
    const expectedLifeYears = Number(formData.get('expectedLifeYears'));

    await saveAccount({ birthday, expectedLifeYears });
  });

  document.querySelector<HTMLFormElement>('#record-form')?.addEventListener('submit', async (event) => {
    event.preventDefault();

    const form = event.currentTarget as HTMLFormElement;
    const formData = new FormData(form);
    const content = String(formData.get('content') ?? '');

    await saveTodayRecord(content);
  });
}

async function loadAccount() {
  const mockAccount = await getMockAccount();
  if (mockAccount) {
    persistAccount(mockAccount);
  }

  render();
}

async function loadTodayRecord() {
  todayRecord = await getMockTodayRecord();

  render();
}

async function loadRecentRecords() {
  recentRecords = await getMockRecentRecords();

  render();
}

async function saveAccount(payload: Pick<Account, 'birthday' | 'expectedLifeYears'>) {
  // 设置页保存后留在当前页面，让用户明确看到保存结果，再自行返回 Today。
  formMessage = '正在保存...';
  render();

  try {
    persistAccount(await saveMockAccount(payload));
    formMessage = '人生账户已更新。';
  } catch (error) {
    formMessage = error instanceof Error ? error.message : '保存失败，请稍后再试。';
  }

  render();
}

async function saveTodayRecord(content: string) {
  // 前端优先阶段先在 Mock 层解析；只有用户确认后才生成一条本地生效记录。
  recordDraft = content;
  recordMessage = '';
  isAnalyzingRecord = true;
  recordPreview = null;
  render();

  try {
    recordPreview = await previewMockRecord({ lifeDate: getTodayDateValue(), content });
    recordMessage = '请确认 AI 对今天的理解。';
  } catch (error) {
    recordMessage = error instanceof Error ? error.message : '暂时无法理解这条记录，请稍后再试。';
  } finally {
    isAnalyzingRecord = false;
  }

  render();
}

function modifyPreview() {
  if (!recordPreview) {
    return;
  }
  recordDraft = recordPreview.content;
  recordPreview = null;
  recordMessage = '已回填原文，你可以修改后重新发送。';
  render();
  document.querySelector<HTMLInputElement>('#record-form input[name="content"]')?.focus();
}

async function confirmPreview() {
  if (!recordPreview) {
    return;
  }
  recordMessage = '正在保存今日账单...';
  render();
  todayRecord = await confirmMockRecord(recordPreview);
  recentRecords = [todayRecord, ...recentRecords.filter((record) => record.lifeDate !== todayRecord?.lifeDate)];
  recordPreview = null;
  recordDraft = '';
  recordMessage = '今日账单已保存。';
  render();
}

render();
void loadAccount();
void loadTodayRecord();
void loadRecentRecords();
