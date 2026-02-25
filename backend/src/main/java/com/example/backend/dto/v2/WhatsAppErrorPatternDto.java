package com.example.backend.dto.v2;

import io.swagger.v3.oas.annotations.media.Schema;

@Schema(description = "WhatsApp error pattern with frequency")
public class WhatsAppErrorPatternDto {

    @Schema(description = "WhatsApp error code", example = "131047")
    private String errorCode;

    @Schema(description = "Human-readable error message")
    private String errorMessage;

    @Schema(description = "Number of occurrences", example = "42")
    private Long count;

    public String getErrorCode() {
        return errorCode;
    }

    public void setErrorCode(String errorCode) {
        this.errorCode = errorCode;
    }

    public String getErrorMessage() {
        return errorMessage;
    }

    public void setErrorMessage(String errorMessage) {
        this.errorMessage = errorMessage;
    }

    public Long getCount() {
        return count;
    }

    public void setCount(Long count) {
        this.count = count;
    }
}
