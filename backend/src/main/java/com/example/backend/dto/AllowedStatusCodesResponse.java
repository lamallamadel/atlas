package com.example.backend.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import java.util.List;

@Schema(description = "Response containing allowed status codes for a case type")
public class AllowedStatusCodesResponse {

    @Schema(description = "Case type code", example = "CRM_LEAD_BUY")
    private String caseType;

    @Schema(description = "List of allowed status codes for this case type")
    private List<String> allowedStatusCodes;

    public AllowedStatusCodesResponse() {}

    public AllowedStatusCodesResponse(String caseType, List<String> allowedStatusCodes) {
        this.caseType = caseType;
        this.allowedStatusCodes = allowedStatusCodes;
    }

    public String getCaseType() {
        return caseType;
    }

    public void setCaseType(String caseType) {
        this.caseType = caseType;
    }

    public List<String> getAllowedStatusCodes() {
        return allowedStatusCodes;
    }

    public void setAllowedStatusCodes(List<String> allowedStatusCodes) {
        this.allowedStatusCodes = allowedStatusCodes;
    }
}
