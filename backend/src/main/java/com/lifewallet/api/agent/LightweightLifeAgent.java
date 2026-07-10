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
                        BigDecimal.valueOf(entry.getValue())
                                .divide(BigDecimal.valueOf(1440), 2, RoundingMode.HALF_UP)
                ))
                .toList();
    }

    private void validate(List<AgentActivity> activities) {
        if (activities.isEmpty() || activities.stream().anyMatch(activity ->
                activity.title().isBlank()
                        || activity.durationMinutes() <= 0
                        || activity.dimension().isBlank()
                        || activity.domain().isBlank())) {
            throw new IllegalStateException("Agent produced an invalid activity structure");
        }
    }
}
