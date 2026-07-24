import { defineConfig, loadEnv } from 'vite';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  return {
    server: {
      port: 5173,
      proxy: {
        '/api': env.VITE_AGENT_PROXY_TARGET || 'http://127.0.0.1:8080',
      },
    },
  };
});
