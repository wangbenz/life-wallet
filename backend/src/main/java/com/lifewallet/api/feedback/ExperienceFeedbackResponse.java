package com.lifewallet.api.feedback;

import java.time.Instant;

public record ExperienceFeedbackResponse(long feedbackId, String content, Instant createdAt) {
}
