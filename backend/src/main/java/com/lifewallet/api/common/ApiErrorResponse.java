package com.lifewallet.api.common;

public record ApiErrorResponse(
        String code,
        String message
) {
}
