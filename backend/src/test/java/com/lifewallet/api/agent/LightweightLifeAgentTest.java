package com.lifewallet.api.agent;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;

class LightweightLifeAgentTest {

    private final LightweightLifeAgent agent = new LightweightLifeAgent(
            new IntentRecognizer(),
            new ActivityExtractor(),
            new LifeOntologyClassifier(),
            new InsightGenerator()
    );

    @Test
    void parsesActivitiesAndBuildsDimensionSummary() {
        AgentAnalysis analysis = agent.analyze(
                "今天上午修 bug，下午开会，晚上学了 40 分钟英语，有点累。"
        );

        assertThat(analysis.intent()).isEqualTo("RECORD_TODAY");
        assertThat(analysis.activities())
                .extracting(AgentActivity::dimension)
                .containsExactly("创造", "创造", "成长");
        assertThat(analysis.activities().get(2).durationMinutes()).isEqualTo(40);
        assertThat(analysis.activities().get(2).title()).isEqualTo("学英语");
        assertThat(analysis.activities().get(2).estimated()).isFalse();
        assertThat(analysis.dimensionSummary())
                .extracting(DimensionSummary::dimension)
                .containsExactly("创造", "成长");
        assertThat(analysis.summary()).contains("创造和成长", "疲惫");
        assertThat(analysis.needsConfirmation()).isTrue();
    }

    @Test
    void recognizesRecordModificationIntent() {
        AgentAnalysis analysis = agent.analyze("改一下，晚上读书半小时");

        assertThat(analysis.intent()).isEqualTo("MODIFY_RECORD");
        assertThat(analysis.activities()).anyMatch(activity ->
                activity.dimension().equals("成长") && activity.durationMinutes() == 30
        );
    }

    @Test
    void treatsFuzzyChineseDurationAsAnEstimate() {
        AgentAnalysis analysis = agent.analyze("下午写方案两三个小时");

        assertThat(analysis.activities()).singleElement().satisfies(activity -> {
            assertThat(activity.durationMinutes()).isEqualTo(150);
            assertThat(activity.estimated()).isTrue();
        });
    }
}
