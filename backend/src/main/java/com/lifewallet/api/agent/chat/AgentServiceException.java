package com.lifewallet.api.agent.chat;

public class AgentServiceException extends RuntimeException {

    private final String code;

    public AgentServiceException(String code, String message) {
        super(message);
        this.code = code;
    }

    public AgentServiceException(String code, String message, Throwable cause) {
        super(message, cause);
        this.code = code;
    }

    public String code() {
        return code;
    }
}
