package com.lifewallet.api.feedback;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;

public record RecordFeedbackRequest(
        @NotNull Long recordId,
        @Pattern(regexp = "accurate|partial|inaccurate") String rating
) {
}
