package com.lifewallet.api.agent;

import org.springframework.stereotype.Component;

@Component
public class IntentRecognizer {

    public String recognize(String content) {
        // 第一版意图只分三类：修改记录、查看总结、记录今天。
        // 默认落到 RECORD_TODAY，是为了让用户自然输入时不需要学习命令格式。
        if (containsAny(content, "改一下", "修改", "更正", "重新解析")) {
            return "MODIFY_RECORD";
        }
        if (containsAny(content, "总结", "复盘", "今天怎么样")) {
            return "VIEW_SUMMARY";
        }
        return "RECORD_TODAY";
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
