import './styles.css';

type Account = {
  accountId: number;
  birthday: string;
  expectedLifeYears: number;
  totalLifeDays: number;
  usedLifeDays: number;
  remainingLifeDays: number;
};

type TodayRecord = {
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

type AgentActivity = {
  title: string;
  durationMinutes: number;
  dimension: string;
  domain: string;
  topic: string;
  estimated: boolean;
};

type DimensionSummary = {
  dimension: string;
  durationMinutes: number;
  lifeCoinAmount: number;
};

type Tab = 'today' | 'life' | 'me';

const accountStorageKey = 'life-wallet-account';

const app = document.querySelector<HTMLDivElement>('#app');

if (!app) {
  throw new Error('App root element not found');
}

const appRoot = app;

let activeTab: Tab = 'today';
let account: Account | null = readAccount();
let todayRecord: TodayRecord | null = null;
let recentRecords: TodayRecord[] = [];
let formMessage = '';
let recordMessage = '';
let recordDraft = '';

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
        <button data-tab="today" class="${activeTab === 'today' ? 'active' : ''}">Today</button>
        <button data-tab="life" class="${activeTab === 'life' ? 'active' : ''}">Life</button>
        <button data-tab="me" class="${activeTab === 'me' ? 'active' : ''}">Me</button>
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
  const used = account ? formatNumber(account.usedLifeDays) : '--';
  const birthday = account?.birthday ?? '还未设置生日';
  const expectedLifeYears = account ? `${account.expectedLifeYears} 年` : '还未设置';
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
        <p class="eyebrow">人生余额</p>
        <h1>${remaining}<span> 元</span></h1>
        <p>今天也会花掉 1 元人生</p>
        <p class="date-line">${todayLabel}</p>
        <dl class="balance-meta">
          <div>
            <dt>已消耗</dt>
            <dd>${used} 天</dd>
          </div>
          <div>
            <dt>预期寿命</dt>
            <dd>${expectedLifeYears}</dd>
          </div>
        </dl>
      </section>

      <section class="agent-panel">
        <div class="agent-avatar">AI</div>
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

      <section class="user-bubble">
        <p>${account ? `我出生于 ${birthday}，预期寿命 ${expectedLifeYears}。` : '我还没有设置人生账户。'}</p>
      </section>

      <section class="agent-panel">
        <div class="agent-avatar">AI</div>
        <div class="agent-bubble muted">
          <p>${account ? renderAgentRecordPrompt() : '先去我的页设置生日和预期寿命，我会帮你计算人生余额。'}</p>
        </div>
      </section>

      ${renderTodayRecord()}

      ${renderComposer()}
    </section>
  `;
}

function renderAgentRecordPrompt() {
  if (!todayRecord) {
    return '人生账户已准备好。现在可以直接告诉我：今天这一元，花去哪了？';
  }

  return todayRecord.needsConfirmation
    ? '我已经理解了你的记录。有些时间是估算的，请看看是否像你的一天。'
    : '我已经理解了你的记录，并生成了今天的人生账单。';
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
        <div class="agent-avatar small">AI</div>
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
        <button data-tab="me" aria-label="创建账户">↑</button>
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
      <button type="submit" aria-label="保存今日记录">↑</button>
      <p>${escapeHtml(recordMessage)}</p>
    </form>
  `;
}

function renderLife() {
  if (activeTab !== 'life') {
    return '';
  }

  return `
    <section class="screen life-screen">
      <section class="page-heading">
        <div class="segmented">
          <button class="active">概览</button>
          <button>趋势</button>
          <button>时间轴</button>
          <button>成就</button>
        </div>
      </section>

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

      <section class="simple-list">
        <div>
          <span>总人生天数</span>
          <strong>${formatNumber(account?.totalLifeDays)} 天</strong>
        </div>
        <div>
          <span>已消耗</span>
          <strong>${formatNumber(account?.usedLifeDays)} 天</strong>
        </div>
        <div>
          <span>剩余</span>
          <strong>${formatNumber(account?.remainingLifeDays)} 天</strong>
        </div>
      </section>

      <section class="recent-records">
        <div class="section-heading">
          <div>
            <p class="eyebrow">最近记录</p>
            <h2>回看最近的人生账单</h2>
          </div>
          <span>${recentRecords.length} 条</span>
        </div>
        ${renderRecentRecords()}
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

  return `
    <section class="screen me-screen">
      <section class="page-heading">
        <p class="eyebrow">Me</p>
        <h1>设置人生账户</h1>
        <p>只需要两个数字，AI 会把它换算成你的人生余额。</p>
      </section>

      <form class="account-form" id="account-form">
        <label>
          <span>生日</span>
          <input name="birthday" type="date" value="${birthday}" required />
        </label>

        <label>
          <span>预期寿命</span>
          <input name="expectedLifeYears" type="number" min="1" max="120" value="${expectedLifeYears}" required />
        </label>

        <button class="primary-action" type="submit">保存账户</button>
        <p class="form-message" id="form-message">${formMessage}</p>
      </form>
    </section>
  `;
}

function bindEvents() {
  // 页面是整屏重渲染，所以所有事件绑定都集中在这里，避免散落在各个 render 函数里。
  document.querySelectorAll<HTMLButtonElement>('[data-tab]').forEach((button) => {
    button.addEventListener('click', () => {
      activeTab = button.dataset.tab as Tab;
      formMessage = '';
      render();
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
  try {
    const response = await fetch('/api/account');

    if (!response.ok) {
      return;
    }

    persistAccount((await response.json()) as Account);
  } catch (error) {
    console.error(error);
  }

  render();
}

async function loadTodayRecord() {
  try {
    const response = await fetch('/api/agent/records/today');

    if (!response.ok) {
      return;
    }

    todayRecord = (await response.json()) as TodayRecord;
  } catch (error) {
    console.error(error);
  }

  render();
}

async function loadRecentRecords() {
  try {
    const response = await fetch('/api/life/recent-records');

    if (!response.ok) {
      return;
    }

    recentRecords = (await response.json()) as TodayRecord[];
  } catch (error) {
    console.error(error);
  }

  render();
}

async function saveAccount(payload: Pick<Account, 'birthday' | 'expectedLifeYears'>) {
  // 保存账户成功后直接回到 Today，让用户马上看到人生余额并开始记录。
  formMessage = '正在保存...';
  render();

  try {
    const response = await fetch('/api/account', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const body = await response.json();

    if (!response.ok) {
      throw new Error(body.message ?? '保存失败');
    }

    persistAccount(body as Account);
    activeTab = 'today';
    formMessage = '';
  } catch (error) {
    formMessage = error instanceof Error ? error.message : '保存失败，请稍后再试。';
  }

  render();
}

async function saveTodayRecord(content: string) {
  // 提交记录后，后端会同步完成 Agent 解析并返回今日人生账单。
  recordDraft = content;
  recordMessage = '正在保存记录...';
  render();

  try {
    const response = await fetch('/api/agent/records', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        lifeDate: getTodayDateValue(),
        content,
      }),
    });

    const body = await response.json();

    if (!response.ok) {
      throw new Error(body.message ?? '保存记录失败');
    }

    todayRecord = body as TodayRecord;
    // 同步刷新 Life 页的轻量历史，让本次账单立刻可回看。
    recentRecords = [todayRecord, ...recentRecords.filter((record) => record.recordId !== todayRecord?.recordId)];
    recordDraft = '';
    recordMessage = body.needsConfirmation ? 'AI 已完成初步理解，请检查估算结果。' : 'AI 已完成理解。';
  } catch (error) {
    recordMessage = error instanceof Error ? error.message : '保存记录失败，请稍后再试。';
  }

  render();
}

render();
void loadAccount();
void loadTodayRecord();
void loadRecentRecords();
