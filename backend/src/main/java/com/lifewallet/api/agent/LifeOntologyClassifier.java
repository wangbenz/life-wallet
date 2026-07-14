package com.lifewallet.api.agent;

import org.springframework.stereotype.Component;

@Component
public class LifeOntologyClassifier {

    public AgentActivity classify(ExtractedActivity activity) {
        String title = activity.title();

        // 这里先用关键词做确定性分类，保证没有外部 AI Key 时也能跑通完整 Agent 流程。
        // 后续接入 LLM 后，可以保留这些规则作为兜底或测试基准。
        if (containsAny(title, "学习", "英语", "读书", "阅读", "课程", "练习", "Java")) {
            return activity(activity, "成长", "学习");
        }
        if (containsAny(title, "工作", "bug", "代码", "开发", "开会", "会议", "方案", "文档", "客户")) {
            return activity(activity, "创造", "工作");
        }
        if (containsAny(title, "运动", "跑步", "健身", "散步", "看病", "瑜伽")) {
            return activity(activity, "健康", "运动");
        }
        if (containsAny(title, "睡觉", "睡眠", "午休", "熬夜", "失眠", "睡了")) {
            return activity(activity, "睡眠", "休息");
        }
        if (containsAny(title, "家人", "朋友", "聊天", "约会", "陪伴", "沟通")) {
            return activity(activity, "关系", "关系");
        }
        if (containsAny(title, "视频", "游戏", "电影", "逛街", "放松", "娱乐")) {
            return activity(activity, "休闲", "娱乐");
        }
        return activity(activity, "生活", "日常");
    }

    private AgentActivity activity(ExtractedActivity source, String dimension, String domain) {
        return new AgentActivity(
                source.title(),
                source.durationMinutes(),
                dimension,
                domain,
                source.title(),
                source.estimated()
        );
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
