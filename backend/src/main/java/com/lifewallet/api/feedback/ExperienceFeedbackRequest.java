package com.lifewallet.api.feedback;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record ExperienceFeedbackRequest(@NotBlank @Size(max = 2000) String content) {
}
