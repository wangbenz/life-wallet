package com.lifewallet.api.agent.chat;

import java.util.List;
import java.util.Map;

public interface AgentModel {

    AgentModelTurn complete(List<Map<String, Object>> messages, List<Map<String, Object>> tools, String conversationId);
}
