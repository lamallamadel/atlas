package com.example.backend.dto.v2;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

public class WhatsAppQuotaUsageResponse {
    private List<OrganizationQuotaUsage> organizations;
    private LocalDateTime timestamp;

    public List<OrganizationQuotaUsage> getOrganizations() {
        return organizations;
    }

    public void setOrganizations(List<OrganizationQuotaUsage> organizations) {
        this.organizations = organizations;
    }

    public LocalDateTime getTimestamp() {
        return timestamp;
    }

    public void setTimestamp(LocalDateTime timestamp) {
        this.timestamp = timestamp;
    }

    public static class OrganizationQuotaUsage {
        private String orgId;
        private Integer quotaTier;
        private Integer quotaLimit;
        private Integer messagesSent;
        private Integer remainingQuota;
        private Double utilizationPercentage;
        private LocalDateTime resetAt;
        private boolean throttled;
        private CostProjection costProjection;

        public String getOrgId() {
            return orgId;
        }

        public void setOrgId(String orgId) {
            this.orgId = orgId;
        }

        public Integer getQuotaTier() {
            return quotaTier;
        }

        public void setQuotaTier(Integer quotaTier) {
            this.quotaTier = quotaTier;
        }

        public Integer getQuotaLimit() {
            return quotaLimit;
        }

        public void setQuotaLimit(Integer quotaLimit) {
            this.quotaLimit = quotaLimit;
        }

        public Integer getMessagesSent() {
            return messagesSent;
        }

        public void setMessagesSent(Integer messagesSent) {
            this.messagesSent = messagesSent;
        }

        public Integer getRemainingQuota() {
            return remainingQuota;
        }

        public void setRemainingQuota(Integer remainingQuota) {
            this.remainingQuota = remainingQuota;
        }

        public Double getUtilizationPercentage() {
            return utilizationPercentage;
        }

        public void setUtilizationPercentage(Double utilizationPercentage) {
            this.utilizationPercentage = utilizationPercentage;
        }

        public LocalDateTime getResetAt() {
            return resetAt;
        }

        public void setResetAt(LocalDateTime resetAt) {
            this.resetAt = resetAt;
        }

        public boolean isThrottled() {
            return throttled;
        }

        public void setThrottled(boolean throttled) {
            this.throttled = throttled;
        }

        public CostProjection getCostProjection() {
            return costProjection;
        }

        public void setCostProjection(CostProjection costProjection) {
            this.costProjection = costProjection;
        }
    }

    public static class CostProjection {
        private BigDecimal totalCostToday;
        private BigDecimal totalCostThisMonth;
        private BigDecimal projectedMonthlyCost;
        private Long conversationCountToday;
        private Long conversationCountThisMonth;
        private Map<String, CostByType> costBreakdown;

        public BigDecimal getTotalCostToday() {
            return totalCostToday;
        }

        public void setTotalCostToday(BigDecimal totalCostToday) {
            this.totalCostToday = totalCostToday;
        }

        public BigDecimal getTotalCostThisMonth() {
            return totalCostThisMonth;
        }

        public void setTotalCostThisMonth(BigDecimal totalCostThisMonth) {
            this.totalCostThisMonth = totalCostThisMonth;
        }

        public BigDecimal getProjectedMonthlyCost() {
            return projectedMonthlyCost;
        }

        public void setProjectedMonthlyCost(BigDecimal projectedMonthlyCost) {
            this.projectedMonthlyCost = projectedMonthlyCost;
        }

        public Long getConversationCountToday() {
            return conversationCountToday;
        }

        public void setConversationCountToday(Long conversationCountToday) {
            this.conversationCountToday = conversationCountToday;
        }

        public Long getConversationCountThisMonth() {
            return conversationCountThisMonth;
        }

        public void setConversationCountThisMonth(Long conversationCountThisMonth) {
            this.conversationCountThisMonth = conversationCountThisMonth;
        }

        public Map<String, CostByType> getCostBreakdown() {
            return costBreakdown;
        }

        public void setCostBreakdown(Map<String, CostByType> costBreakdown) {
            this.costBreakdown = costBreakdown;
        }
    }

    public static class CostByType {
        private String conversationType;
        private Long count;
        private BigDecimal totalCost;

        public CostByType(String conversationType, Long count, BigDecimal totalCost) {
            this.conversationType = conversationType;
            this.count = count;
            this.totalCost = totalCost;
        }

        public String getConversationType() {
            return conversationType;
        }

        public void setConversationType(String conversationType) {
            this.conversationType = conversationType;
        }

        public Long getCount() {
            return count;
        }

        public void setCount(Long count) {
            this.count = count;
        }

        public BigDecimal getTotalCost() {
            return totalCost;
        }

        public void setTotalCost(BigDecimal totalCost) {
            this.totalCost = totalCost;
        }
    }
}
