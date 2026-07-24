package com.lifewallet.api.common;

import java.util.stream.Collectors;

import jakarta.validation.ConstraintViolationException;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import com.lifewallet.api.agent.chat.AgentServiceException;

@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(ApiException.class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    public ApiErrorResponse handleApiException(ApiException exception) {
        return new ApiErrorResponse(exception.code(), exception.getMessage());
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    public ApiErrorResponse handleValidationException(MethodArgumentNotValidException exception) {
        String message = exception.getBindingResult()
                .getFieldErrors()
                .stream()
                .map(error -> error.getField() + ": " + error.getDefaultMessage())
                .collect(Collectors.joining("; "));

        return new ApiErrorResponse("VALIDATION_FAILED", message);
    }

    @ExceptionHandler(ConstraintViolationException.class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    public ApiErrorResponse handleConstraintViolation(ConstraintViolationException exception) {
        return new ApiErrorResponse("VALIDATION_FAILED", "请求身份标识无效。");
    }

    @ExceptionHandler(AgentServiceException.class)
    public ResponseEntity<ApiErrorResponse> handleAgentServiceException(AgentServiceException exception) {
        HttpStatus status;
        if ("AGENT_NOT_CONFIGURED".equals(exception.code())) {
            status = HttpStatus.SERVICE_UNAVAILABLE;
        } else if (exception.code().startsWith("MODEL_")) {
            status = HttpStatus.BAD_GATEWAY;
        } else if ("CONVERSATION_NOT_FOUND".equals(exception.code())) {
            status = HttpStatus.NOT_FOUND;
        } else {
            status = HttpStatus.BAD_REQUEST;
        }
        return ResponseEntity.status(status)
                .body(new ApiErrorResponse(exception.code(), exception.getMessage()));
    }
}
