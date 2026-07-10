package com.lifewallet.api.agent;

import java.util.List;

import org.springframework.stereotype.Component;

@Component
public class InsightGenerator {

    public String generate(List<DimensionSummary> summaries, String originalContent) {
        String dimensions = summaries.stream()
                .limit(2)
                .map(DimensionSummary::dimension)
                .reduce((first, second) -> first + "和" + second)
                .orElse("生活");

        String state = containsAny(originalContent, "累", "疲惫", "焦虑", "低落")
                ? "，也留意到了你今天有些疲惫"
                : "";
        return "今天这一元人生主要投入在" + dimensions + "上" + state + "。这是基于当前记录的初步理解。";
    }

    private boolean containsAny(String content, String... keywords) {
        for (String keyword : keywords) {
            if (content.contains(keyword)) {
                return true;
            }
        }
        return false;
    }
}
