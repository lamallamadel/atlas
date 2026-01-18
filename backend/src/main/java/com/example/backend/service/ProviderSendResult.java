package com.example.backend.service;

import java.util.Map;

public class ProviderSendResult {
    
    private final boolean success;
    private final String providerMessageId;
    private final String errorCode;
    private final String errorMessage;
    private final boolean retryable;
    private final Map<String, Object> responseData;
    
    public ProviderSendResult(boolean success, String providerMessageId, String errorCode, 
                             String errorMessage, boolean retryable, Map<String, Object> responseData) {
        this.success = success;
        this.providerMessageId = providerMessageId;
        this.errorCode = errorCode;
        this.errorMessage = errorMessage;
        this.retryable = retryable;
        this.responseData = responseData;
    }
    
    public static ProviderSendResult success(String providerMessageId, Map<String, Object> responseData) {
        return new ProviderSendResult(true, providerMessageId, null, null, false, responseData);
    }
    
    public static ProviderSendResult failure(String errorCode, String errorMessage, boolean retryable, Map<String, Object> responseData) {
        return new ProviderSendResult(false, null, errorCode, errorMessage, retryable, responseData);
    }
    
    public boolean isSuccess() {
        return success;
    }
    
    public String getProviderMessageId() {
        return providerMessageId;
    }
    
    public String getErrorCode() {
        return errorCode;
    }
    
    public String getErrorMessage() {
        return errorMessage;
    }
    
    public boolean isRetryable() {
        return retryable;
    }
    
    public Map<String, Object> getResponseData() {
        return responseData;
    }
}
