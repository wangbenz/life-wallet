package com.lifewallet.api.agent;

import org.springframework.stereotype.Component;

@Component
public class IntentRecognizer {

    public String recognize(String content) {
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
