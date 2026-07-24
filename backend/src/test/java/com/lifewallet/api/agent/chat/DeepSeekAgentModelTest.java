package com.lifewallet.api.agent.chat;

import static org.assertj.core.api.Assertions.assertThat;

import java.io.IOException;
import java.net.InetSocketAddress;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.List;
import java.util.Map;
import java.util.concurrent.atomic.AtomicReference;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.sun.net.httpserver.HttpServer;
import org.junit.jupiter.api.Test;

class DeepSeekAgentModelTest {

    @Test
    void sendsOpenAiCompatibleToolRequestAndParsesToolCall() throws IOException {
        AtomicReference<String> authorization = new AtomicReference<>();
        AtomicReference<String> requestBody = new AtomicReference<>();
        HttpServer server = HttpServer.create(new InetSocketAddress(0), 0);
        server.createContext("/chat/completions", exchange -> {
            authorization.set(exchange.getRequestHeaders().getFirst("Authorization"));
            requestBody.set(new String(exchange.getRequestBody().readAllBytes(), StandardCharsets.UTF_8));
            byte[] response = """
                    {
                      "choices": [{
                        "message": {
                          "role": "assistant",
                          "content": null,
                          "tool_calls": [{
                            "id": "call_1",
                            "type": "function",
                            "function": {
                              "name": "list_records",
                              "arguments": "{\\\"scope\\\":\\\"today\\\"}"
                            }
                          }]
                        }
                      }]
                    }
                    """.getBytes(StandardCharsets.UTF_8);
            exchange.getResponseHeaders().set("Content-Type", "application/json");
            exchange.sendResponseHeaders(200, response.length);
            exchange.getResponseBody().write(response);
            exchange.close();
        });
        server.start();

        try {
            DeepSeekProperties properties = new DeepSeekProperties(
                    "http://127.0.0.1:" + server.getAddress().getPort(),
                    "test-secret",
                    "",
                    "",
                    false,
                    "deepseek-v4-flash",
                    Duration.ofSeconds(1),
                    Duration.ofSeconds(2),
                    4
            );
            DeepSeekApiKeyProvider keyProvider = new DeepSeekApiKeyProvider(
                    properties,
                    org.mockito.Mockito.mock(DeepSeekSecretStore.class),
                    new DeepSeekSecretCipher()
            );
            keyProvider.afterPropertiesSet();
            DeepSeekAgentModel model = new DeepSeekAgentModel(
                    properties,
                    keyProvider,
                    new ObjectMapper()
            );

            AgentModelTurn turn = model.complete(
                    List.of(Map.of("role", "user", "content", "我今天记了什么？")),
                    List.of(Map.of("type", "function", "function", Map.of("name", "list_records"))),
                    "conv_test"
            );

            assertThat(authorization.get()).isEqualTo("Bearer test-secret");
            assertThat(requestBody.get()).contains(
                    "\"model\":\"deepseek-v4-flash\"",
                    "\"thinking\":{\"type\":\"disabled\"}",
                    "\"tools\""
            );
            assertThat(turn.toolCalls()).singleElement().satisfies(call -> {
                assertThat(call.id()).isEqualTo("call_1");
                assertThat(call.name()).isEqualTo("list_records");
                assertThat(call.arguments()).isEqualTo("{\"scope\":\"today\"}");
            });
        } finally {
            server.stop(0);
        }
    }
}
