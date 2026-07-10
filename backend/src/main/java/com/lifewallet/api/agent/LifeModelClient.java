package com.lifewallet.api.agent;

/**
 * Boundary for a future LLM implementation. Phase 1 keeps orchestration explicit
 * and uses deterministic components so the demo works without external secrets.
 */
public interface LifeModelClient {

    AgentAnalysis analyze(String content);
}
