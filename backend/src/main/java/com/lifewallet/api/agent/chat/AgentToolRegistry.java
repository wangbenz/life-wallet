package com.lifewallet.api.agent.chat;

import java.time.LocalDate;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;

import org.springframework.stereotype.Component;

@Component
public class AgentToolRegistry {

    private final ObjectMapper objectMapper;

    public AgentToolRegistry(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
    }

    public List<Map<String, Object>> definitions() {
        return List.of(
                tool("list_records", "读取已确认的生活记录。查询、修改或删除前必须先调用。", objectSchema(Map.of(
                        "scope", stringEnum("today", "recent", "context")
                ), List.of("scope"))),
                tool("create_life_record", "准备新增一条生活记录。只生成待确认操作，不直接写入。", objectSchema(Map.of(
                        "lifeDate", stringProperty("YYYY-MM-DD 格式的生活日期"),
                        "content", stringProperty("需要记录的原始生活描述")
                ), List.of("lifeDate", "content"))),
                tool("update_activity_duration", "准备修改某条已确认记录中一个活动的时长。只生成待确认操作。", objectSchema(Map.of(
                        "recordId", integerProperty("目标记录 ID", 1, Long.MAX_VALUE),
                        "activityIndex", integerProperty("活动在记录中的序号，从 0 开始", 0, 19),
                        "newMinutes", integerProperty("修改后的分钟数", 1, 1440)
                ), List.of("recordId", "activityIndex", "newMinutes"))),
                tool("delete_life_record", "准备删除一整条已确认记录。只生成待确认操作。", objectSchema(Map.of(
                        "recordId", integerProperty("目标记录 ID", 1, Long.MAX_VALUE)
                ), List.of("recordId")))
        );
    }

    public ToolExecutionResult execute(AgentToolCall call, AgentChatRequest request) {
        JsonNode arguments = parseArguments(call.arguments());
        return switch (call.name()) {
            case "list_records" -> listRecords(arguments, request);
            case "create_life_record" -> prepareCreate(arguments, request);
            case "update_activity_duration" -> prepareUpdate(arguments, request);
            case "delete_life_record" -> prepareDelete(arguments, request);
            default -> throw new AgentServiceException("UNKNOWN_TOOL", "模型选择了不允许的工具，操作已停止。");
        };
    }

    private ToolExecutionResult listRecords(JsonNode arguments, AgentChatRequest request) {
        String scope = requiredText(arguments, "scope");
        List<ClientLifeRecord> records = request.records().stream()
                .filter(record -> switch (scope) {
                    case "today" -> record.lifeDate().equals(request.lifeDate());
                    case "context" -> request.contextRecordId() != null && record.recordId() == request.contextRecordId();
                    case "recent" -> true;
                    default -> throw new AgentServiceException("INVALID_TOOL_ARGUMENTS", "记录查询范围无效。");
                })
                .sorted(Comparator.comparing(ClientLifeRecord::lifeDate).reversed())
                .limit(5)
                .toList();
        try {
            return ToolExecutionResult.read(
                    objectMapper.writeValueAsString(Map.of("records", records)),
                    records.stream().map(ClientLifeRecord::recordId).toList()
            );
        } catch (JsonProcessingException exception) {
            throw new AgentServiceException("TOOL_RESULT_FAILED", "记录查询结果无法处理。", exception);
        }
    }

    private ToolExecutionResult prepareCreate(JsonNode arguments, AgentChatRequest request) {
        LocalDate lifeDate;
        try {
            lifeDate = LocalDate.parse(requiredText(arguments, "lifeDate"));
        } catch (RuntimeException exception) {
            throw new AgentServiceException("INVALID_TOOL_ARGUMENTS", "新增记录的日期无效。");
        }
        if (lifeDate.isAfter(LocalDate.now()) || lifeDate.isAfter(request.lifeDate())) {
            throw new AgentServiceException("INVALID_TOOL_ARGUMENTS", "不能新增未来日期的记录。");
        }
        String content = requiredText(arguments, "content").trim();
        if (content.isBlank() || content.length() > 2000) {
            throw new AgentServiceException("INVALID_TOOL_ARGUMENTS", "新增记录内容无效。");
        }
        return ToolExecutionResult.pending(
                PendingActionResponse.create(lifeDate, content),
                "我整理出一条待新增的生活记录。确认后才会保存在你的浏览器中。"
        );
    }

    private ToolExecutionResult prepareUpdate(JsonNode arguments, AgentChatRequest request) {
        long recordId = requiredLong(arguments, "recordId");
        int activityIndex = requiredInt(arguments, "activityIndex", 0, 19);
        int newMinutes = requiredInt(arguments, "newMinutes", 1, 1440);
        ClientLifeRecord record = findRecord(request.records(), recordId);
        if (activityIndex >= record.activities().size()) {
            throw new AgentServiceException("INVALID_TOOL_ARGUMENTS", "目标活动不存在，修改已停止。");
        }
        ClientActivity activity = record.activities().get(activityIndex);
        return ToolExecutionResult.pending(
                PendingActionResponse.update(
                        recordId,
                        activityIndex,
                        activity.title(),
                        activity.durationMinutes(),
                        newMinutes
                ),
                "我找到了对应活动。确认后只会修改这段活动的时长。"
        );
    }

    private ToolExecutionResult prepareDelete(JsonNode arguments, AgentChatRequest request) {
        long recordId = requiredLong(arguments, "recordId");
        findRecord(request.records(), recordId);
        return ToolExecutionResult.pending(
                PendingActionResponse.delete(recordId),
                "我找到了这条记录。删除会影响其中全部生活片段，请先确认。"
        );
    }

    private ClientLifeRecord findRecord(List<ClientLifeRecord> records, long recordId) {
        return records.stream()
                .filter(record -> record.recordId() == recordId)
                .findFirst()
                .orElseThrow(() -> new AgentServiceException("RECORD_NOT_FOUND", "目标记录不存在，操作已停止。"));
    }

    private JsonNode parseArguments(String arguments) {
        try {
            JsonNode node = objectMapper.readTree(arguments);
            if (!node.isObject()) {
                throw new AgentServiceException("INVALID_TOOL_ARGUMENTS", "工具参数必须是 JSON 对象。");
            }
            return node;
        } catch (JsonProcessingException exception) {
            throw new AgentServiceException("INVALID_TOOL_ARGUMENTS", "模型生成的工具参数不是有效 JSON。", exception);
        }
    }

    private String requiredText(JsonNode node, String field) {
        String value = node.path(field).asText("");
        if (value.isBlank()) {
            throw new AgentServiceException("INVALID_TOOL_ARGUMENTS", "工具参数缺少 " + field + "。");
        }
        return value;
    }

    private long requiredLong(JsonNode node, String field) {
        if (!node.has(field) || !node.path(field).canConvertToLong()) {
            throw new AgentServiceException("INVALID_TOOL_ARGUMENTS", "工具参数 " + field + " 无效。");
        }
        return node.path(field).asLong();
    }

    private int requiredInt(JsonNode node, String field, int min, int max) {
        if (!node.has(field) || !node.path(field).canConvertToInt()) {
            throw new AgentServiceException("INVALID_TOOL_ARGUMENTS", "工具参数 " + field + " 无效。");
        }
        int value = node.path(field).asInt();
        if (value < min || value > max) {
            throw new AgentServiceException("INVALID_TOOL_ARGUMENTS", "工具参数 " + field + " 超出允许范围。");
        }
        return value;
    }

    private Map<String, Object> tool(String name, String description, Map<String, Object> parameters) {
        return Map.of("type", "function", "function", Map.of(
                "name", name,
                "description", description,
                "parameters", parameters
        ));
    }

    private Map<String, Object> objectSchema(Map<String, Object> properties, List<String> required) {
        Map<String, Object> schema = new LinkedHashMap<>();
        schema.put("type", "object");
        schema.put("properties", properties);
        schema.put("required", required);
        schema.put("additionalProperties", false);
        return schema;
    }

    private Map<String, Object> stringProperty(String description) {
        return Map.of("type", "string", "description", description);
    }

    private Map<String, Object> stringEnum(String... values) {
        return Map.of("type", "string", "enum", List.of(values));
    }

    private Map<String, Object> integerProperty(String description, long min, long max) {
        return Map.of("type", "integer", "description", description, "minimum", min, "maximum", max);
    }
}
