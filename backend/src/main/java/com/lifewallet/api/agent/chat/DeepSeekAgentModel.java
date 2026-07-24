package com.lifewallet.api.agent.chat;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;

import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;

@Component
public class DeepSeekAgentModel implements AgentModel {

    private final DeepSeekProperties properties;
    private final DeepSeekApiKeyProvider apiKeyProvider;
    private final ObjectMapper objectMapper;
    private final RestClient restClient;

    public DeepSeekAgentModel(
            DeepSeekProperties properties,
            DeepSeekApiKeyProvider apiKeyProvider,
            ObjectMapper objectMapper
    ) {
        this.properties = properties;
        this.apiKeyProvider = apiKeyProvider;
        this.objectMapper = objectMapper;
        SimpleClientHttpRequestFactory requestFactory = new SimpleClientHttpRequestFactory();
        requestFactory.setConnectTimeout(properties.connectTimeout());
        requestFactory.setReadTimeout(properties.readTimeout());
        this.restClient = RestClient.builder()
                .baseUrl(properties.baseUrl())
                .requestFactory(requestFactory)
                .build();
    }

    @Override
    public AgentModelTurn complete(
            List<Map<String, Object>> messages,
            List<Map<String, Object>> tools,
            String conversationId
    ) {
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("model", properties.model());
        body.put("messages", messages);
        body.put("tools", tools);
        body.put("tool_choice", "auto");
        body.put("thinking", Map.of("type", "disabled"));
        body.put("temperature", 0.2);
        body.put("max_tokens", 900);
        body.put("user_id", conversationId);

        try {
            JsonNode response = restClient.post()
                    .uri("/chat/completions")
                    .headers(headers -> headers.setBearerAuth(apiKeyProvider.getApiKey()))
                    .body(body)
                    .retrieve()
                    .body(JsonNode.class);
            JsonNode message = response == null ? null : response.path("choices").path(0).path("message");
            if (message == null || message.isMissingNode()) {
                throw new AgentServiceException("MODEL_INVALID_RESPONSE", "模型没有返回可用结果，请稍后再试。");
            }
            List<AgentToolCall> toolCalls = new ArrayList<>();
            message.path("tool_calls").forEach(call -> toolCalls.add(new AgentToolCall(
                    call.path("id").asText(),
                    call.path("function").path("name").asText(),
                    call.path("function").path("arguments").asText("{}")
            )));
            Map<String, Object> assistantMessage = objectMapper.convertValue(
                    message,
                    new TypeReference<>() {
                    }
            );
            return new AgentModelTurn(message.path("content").asText(""), toolCalls, assistantMessage);
        } catch (AgentServiceException exception) {
            throw exception;
        } catch (RestClientException exception) {
            throw new AgentServiceException("MODEL_REQUEST_FAILED", "Life Agent 暂时无法连接模型服务，请稍后再试。", exception);
        } catch (RuntimeException exception) {
            throw new AgentServiceException("MODEL_INVALID_RESPONSE", "模型结果无法安全处理，请稍后再试。", exception);
        }
    }
}
