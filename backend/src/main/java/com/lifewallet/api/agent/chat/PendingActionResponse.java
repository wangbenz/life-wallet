package com.lifewallet.api.agent.chat;

import java.time.LocalDate;

public record PendingActionResponse(
        String type,
        Long recordId,
        Integer activityIndex,
        String activityTitle,
        Integer oldMinutes,
        Integer newMinutes,
        LocalDate lifeDate,
        String content
) {
    public static PendingActionResponse create(LocalDate lifeDate, String content) {
        return new PendingActionResponse("CREATE_RECORD", null, null, null, null, null, lifeDate, content);
    }

    public static PendingActionResponse update(
            long recordId,
            int activityIndex,
            String activityTitle,
            int oldMinutes,
            int newMinutes
    ) {
        return new PendingActionResponse(
                "UPDATE_DURATION",
                recordId,
                activityIndex,
                activityTitle,
                oldMinutes,
                newMinutes,
                null,
                null
        );
    }

    public static PendingActionResponse delete(long recordId) {
        return new PendingActionResponse("DELETE_RECORD", recordId, null, null, null, null, null, null);
    }
}
