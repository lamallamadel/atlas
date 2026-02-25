package com.example.backend.dto.v2;

import io.swagger.v3.oas.annotations.media.Schema;
import java.time.LocalDateTime;
import java.util.List;

@Schema(description = "Response containing WhatsApp error patterns aggregated by frequency")
public class WhatsAppErrorPatternsResponse {

    @Schema(description = "List of error patterns sorted by frequency")
    private List<WhatsAppErrorPatternDto> errorPatterns;

    @Schema(description = "Total number of errors in analysis period", example = "156")
    private Long totalErrors;

    @Schema(description = "Total number of messages in analysis period", example = "1250")
    private Long totalMessagesInPeriod;

    @Schema(description = "Failure rate percentage", example = "12.48")
    private Double failureRate;

    @Schema(description = "Number of hours analyzed", example = "24")
    private int hoursAnalyzed;

    @Schema(description = "Start of analysis period")
    private LocalDateTime analysisPeriodStart;

    @Schema(description = "End of analysis period")
    private LocalDateTime analysisPeriodEnd;

    @Schema(description = "Response timestamp")
    private LocalDateTime timestamp;

    public List<WhatsAppErrorPatternDto> getErrorPatterns() {
        return errorPatterns;
    }

    public void setErrorPatterns(List<WhatsAppErrorPatternDto> errorPatterns) {
        this.errorPatterns = errorPatterns;
    }

    public Long getTotalErrors() {
        return totalErrors;
    }

    public void setTotalErrors(Long totalErrors) {
        this.totalErrors = totalErrors;
    }

    public Long getTotalMessagesInPeriod() {
        return totalMessagesInPeriod;
    }

    public void setTotalMessagesInPeriod(Long totalMessagesInPeriod) {
        this.totalMessagesInPeriod = totalMessagesInPeriod;
    }

    public Double getFailureRate() {
        return failureRate;
    }

    public void setFailureRate(Double failureRate) {
        this.failureRate = failureRate;
    }

    public int getHoursAnalyzed() {
        return hoursAnalyzed;
    }

    public void setHoursAnalyzed(int hoursAnalyzed) {
        this.hoursAnalyzed = hoursAnalyzed;
    }

    public LocalDateTime getAnalysisPeriodStart() {
        return analysisPeriodStart;
    }

    public void setAnalysisPeriodStart(LocalDateTime analysisPeriodStart) {
        this.analysisPeriodStart = analysisPeriodStart;
    }

    public LocalDateTime getAnalysisPeriodEnd() {
        return analysisPeriodEnd;
    }

    public void setAnalysisPeriodEnd(LocalDateTime analysisPeriodEnd) {
        this.analysisPeriodEnd = analysisPeriodEnd;
    }

    public LocalDateTime getTimestamp() {
        return timestamp;
    }

    public void setTimestamp(LocalDateTime timestamp) {
        this.timestamp = timestamp;
    }
}
