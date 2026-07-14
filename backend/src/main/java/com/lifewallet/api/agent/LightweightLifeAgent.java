package com.lifewallet.api.agent;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import org.springframework.stereotype.Service;

@Service
public class LightweightLifeAgent implements LifeModelClient {

    private final IntentRecognizer intentRecognizer;
    private final ActivityExtractor activityExtractor;
    private final LifeOntologyClassifier classifier;
    private final InsightGenerator insightGenerator;

    public LightweightLifeAgent(
            IntentRecognizer intentRecognizer,
            ActivityExtractor activityExtractor,
            LifeOntologyClassifier classifier,
            InsightGenerator insightGenerator
    ) {
        this.intentRecognizer = intentRecognizer;
        this.activityExtractor = activityExtractor;
        this.classifier = classifier;
        this.insightGenerator = insightGenerator;
    }

    @Override
    public AgentAnalysis analyze(String content) {
        // 第一版轻量 Agent 的主流程刻意显式展开：
        // 先识别意图，再抽取活动，再归类到人生维度，最后生成总结和确认提示。
        // 这样后续接入 LLM 或 LangChain4j 时，也能清楚知道每一步替换的位置。
        String intent = intentRecognizer.recognize(content);
        List<AgentActivity> activities = activityExtractor.extract(content).stream()
                .map(classifier::classify)
                .toList();
        validate(activities);

        List<DimensionSummary> summaries = summarize(activities);
        boolean needsConfirmation = activities.stream().anyMatch(AgentActivity::estimated);
        String summary = insightGenerator.generate(summaries, content);
        return new AgentAnalysis(intent, summary, activities, summaries, needsConfirmation);
    }

    private List<DimensionSummary> summarize(List<AgentActivity> activities) {
        Map<String, Integer> totals = new LinkedHashMap<>();
        activities.forEach(activity -> totals.merge(
                activity.dimension(),
                activity.durationMinutes(),
                Integer::sum
        ));

        return totals.entrySet().stream()
                .sorted(Map.Entry.<String, Integer>comparingByValue().reversed())
                .map(entry -> new DimensionSummary(
                        entry.getKey(),
                        entry.getValue(),
                        // 1 天 = 1 元人生，所以某维度支出 = 分钟数 / 1440。
                        BigDecimal.valueOf(entry.getValue())
                                .divide(BigDecimal.valueOf(1440), 2, RoundingMode.HALF_UP)
                ))
                .toList();
    }

    private void validate(List<AgentActivity> activities) {
        // 这里是 Agent 输出的最小结构校验，避免前端收到空标题、空维度或无效时长。
        // 后续接入真实 LLM 后，这一层会更重要，因为模型输出需要被代码兜住。
        if (activities.isEmpty() || activities.stream().anyMatch(activity ->
                activity.title().isBlank()
                        || activity.durationMinutes() <= 0
                        || activity.dimension().isBlank()
                        || activity.domain().isBlank())) {
            throw new IllegalStateException("Agent produced an invalid activity structure");
        }
    }
}
