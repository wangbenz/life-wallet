package com.lifewallet.api.feedback;

import java.time.Instant;

public record RecordFeedbackResponse(long recordId, String rating, Instant createdAt) {
}
