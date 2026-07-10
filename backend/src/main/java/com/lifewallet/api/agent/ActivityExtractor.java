package com.lifewallet.api.agent;

import java.util.ArrayList;
import java.util.List;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import org.springframework.stereotype.Component;

@Component
public class ActivityExtractor {

    private static final Pattern NUMBER_DURATION = Pattern.compile("(\\d+(?:\\.\\d+)?)\\s*(个?小时|分钟|分)");
    private static final Pattern CHINESE_HOUR_DURATION = Pattern.compile("(半|一|两|二|三|四|五|六|七|八)个?小时");
    private static final Pattern TIME_PREFIX = Pattern.compile("^(今天|昨天)?(早上|上午|中午|下午|晚上|夜里|凌晨|睡前)?");
    private static final Pattern DURATION_WORDS = Pattern.compile("大概|大约|约|差不多|有点久|一会儿|两三个小时");

    public List<ExtractedActivity> extract(String content) {
        List<ExtractedActivity> activities = new ArrayList<>();

        // 第一版先用标点把一天拆成多个生活片段。
        // 这不是最终 NLP 方案，但足够支撑“短平快”的 Demo 验证。
        for (String rawClause : content.split("[，,。；;！!？?、\\n]+")) {
            String clause = rawClause.trim();
            if (clause.isBlank() || isOnlyState(clause)) {
                continue;
            }

            Duration duration = extractDuration(clause);
            String title = normalizeTitle(clause);
            if (!title.isBlank()) {
                activities.add(new ExtractedActivity(title, duration.minutes(), duration.estimated()));
            }
        }

        if (activities.isEmpty()) {
            // 如果用户只写了一句很模糊的话，也保留为一个估算活动，避免记录完全丢失。
            activities.add(new ExtractedActivity(normalizeTitle(content), 60, true));
        }
        return List.copyOf(activities);
    }

    private Duration extractDuration(String clause) {
        if (clause.contains("两三个小时")) {
            // “两三个小时”按 2.5 小时估算，并标记为 estimated，前端会提醒用户确认。
            return new Duration(150, true);
        }

        Matcher numberMatcher = NUMBER_DURATION.matcher(clause);
        if (numberMatcher.find()) {
            double value = Double.parseDouble(numberMatcher.group(1));
            int minutes = numberMatcher.group(2).contains("小时")
                    ? (int) Math.round(value * 60)
                    : (int) Math.round(value);
            return new Duration(Math.max(minutes, 1), false);
        }

        Matcher chineseMatcher = CHINESE_HOUR_DURATION.matcher(clause);
        if (chineseMatcher.find()) {
            double hours = switch (chineseMatcher.group(1)) {
                case "半" -> 0.5;
                case "一" -> 1;
                case "两", "二" -> 2;
                case "三" -> 3;
                case "四" -> 4;
                case "五" -> 5;
                case "六" -> 6;
                case "七" -> 7;
                default -> 8;
            };
            return new Duration((int) Math.round(hours * 60), false);
        }

        return new Duration(60, true);
    }

    private String normalizeTitle(String clause) {
        // 标题只保留用户真正做了什么，去掉时间、时长和语气词，便于展示和分类。
        String title = TIME_PREFIX.matcher(clause).replaceFirst("");
        title = NUMBER_DURATION.matcher(title).replaceAll("");
        title = CHINESE_HOUR_DURATION.matcher(title).replaceAll("");
        title = DURATION_WORDS.matcher(title).replaceAll("");
        title = title.replaceFirst("^(我|一直|主要|先|又|还)", "").trim();
        title = title.replaceAll("\\s+", "");
        title = title.replaceFirst("^(学|读|看|写|做|练)了", "$1");
        return title.isBlank() ? clause.trim() : title;
    }

    private boolean isOnlyState(String clause) {
        return clause.matches(".*(有点累|很累|心情不错|状态不好|焦虑|低落)$")
                && !clause.matches(".*(工作|学习|运动|跑步|睡|开会|写|看|刷|陪|做饭).*" );
    }

    private record Duration(int minutes, boolean estimated) {
    }
}
