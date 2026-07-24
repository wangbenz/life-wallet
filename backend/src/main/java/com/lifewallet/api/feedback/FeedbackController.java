package com.lifewallet.api.feedback;

import java.util.List;

import jakarta.validation.Valid;

import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/feedback")
@Validated
public class FeedbackController {

    private final FeedbackService feedbackService;

    public FeedbackController(FeedbackService feedbackService) {
        this.feedbackService = feedbackService;
    }

    @GetMapping("/records")
    public List<RecordFeedbackResponse> getRecordFeedback(@RequestHeader("X-Life-Wallet-Owner-Key") @jakarta.validation.constraints.Pattern(regexp = "[A-Za-z0-9_-]{8,64}") String ownerKey) {
        return feedbackService.getRecordFeedback(ownerKey);
    }

    @PostMapping("/records")
    public RecordFeedbackResponse saveRecordFeedback(
            @RequestHeader("X-Life-Wallet-Owner-Key") @jakarta.validation.constraints.Pattern(regexp = "[A-Za-z0-9_-]{8,64}") String ownerKey,
            @Valid @RequestBody RecordFeedbackRequest request
    ) {
        return feedbackService.saveRecordFeedback(ownerKey, request);
    }

    @GetMapping("/experience")
    public List<ExperienceFeedbackResponse> getExperienceFeedback(@RequestHeader("X-Life-Wallet-Owner-Key") @jakarta.validation.constraints.Pattern(regexp = "[A-Za-z0-9_-]{8,64}") String ownerKey) {
        return feedbackService.getExperienceFeedback(ownerKey);
    }

    @PostMapping("/experience")
    public ExperienceFeedbackResponse saveExperienceFeedback(
            @RequestHeader("X-Life-Wallet-Owner-Key") @jakarta.validation.constraints.Pattern(regexp = "[A-Za-z0-9_-]{8,64}") String ownerKey,
            @Valid @RequestBody ExperienceFeedbackRequest request
    ) {
        return feedbackService.saveExperienceFeedback(ownerKey, request);
    }
}
