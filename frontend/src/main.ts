import './styles.css';

type HealthResponse = {
  status: string;
  service: string;
  timestamp: string;
};

const app = document.querySelector<HTMLDivElement>('#app');

if (!app) {
  throw new Error('App root element not found');
}

app.innerHTML = `
  <main class="app-shell">
    <section class="phone-frame">
      <header class="top-bar">
        <span>9:41</span>
        <strong>Life Wallet</strong>
      </header>

      <section class="balance-panel">
        <p class="eyebrow">人生余额</p>
        <h1>28,652<span> 元</span></h1>
        <p>今天也会花掉 1 元人生</p>
      </section>

      <section class="agent-panel">
        <div class="agent-avatar">AI</div>
        <div class="agent-bubble">
          <p>嗨，我是你的人生助手。</p>
          <p>今天这一元，花去哪了？</p>
        </div>
      </section>

      <section class="health-card">
        <p class="eyebrow">Milestone 1</p>
        <h2>前后端连接状态</h2>
        <p id="health-status">正在连接后端...</p>
      </section>

      <nav class="tab-bar" aria-label="主导航">
        <button class="active">Today</button>
        <button>Life</button>
        <button>Me</button>
      </nav>
    </section>
  </main>
`;

const healthStatus = document.querySelector<HTMLParagraphElement>('#health-status');

async function loadHealth() {
  if (!healthStatus) {
    return;
  }

  try {
    const response = await fetch('/api/health');

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data = (await response.json()) as HealthResponse;
    healthStatus.textContent = `${data.service}: ${data.status}`;
  } catch (error) {
    healthStatus.textContent = '后端暂未连接，请确认 Spring Boot 已启动。';
    console.error(error);
  }
}

void loadHealth();
