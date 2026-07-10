package com.lifewallet.api.agent;

import java.math.BigDecimal;

public record DimensionSummary(
        String dimension,
        int durationMinutes,
        BigDecimal lifeCoinAmount
) {
}
