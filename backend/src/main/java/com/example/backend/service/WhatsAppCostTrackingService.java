package com.example.backend.service;

import com.example.backend.entity.WhatsAppCostTracking;
import com.example.backend.entity.enums.WhatsAppConversationType;
import com.example.backend.repository.WhatsAppCostTrackingRepository;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class WhatsAppCostTrackingService {

    private static final Logger logger = LoggerFactory.getLogger(WhatsAppCostTrackingService.class);

    private final WhatsAppCostTrackingRepository costTrackingRepository;

    public WhatsAppCostTrackingService(WhatsAppCostTrackingRepository costTrackingRepository) {
        this.costTrackingRepository = costTrackingRepository;
    }

    @Transactional
    public WhatsAppCostTracking trackConversationCost(
            String orgId,
            Long messageId,
            String phoneNumber,
            WhatsAppConversationType conversationType) {

        WhatsAppCostTracking tracking = new WhatsAppCostTracking();
        tracking.setOrgId(orgId);
        tracking.setMessageId(messageId);
        tracking.setPhoneNumber(phoneNumber);
        tracking.setConversationType(conversationType);
        tracking.setCostPerConversation(conversationType.getCostPerConversation());
        tracking.setConversationOpenedAt(LocalDateTime.now());
        tracking.setMessageCount(1);
        tracking.setTotalCost(conversationType.getCostPerConversation());

        WhatsAppCostTracking saved = costTrackingRepository.save(tracking);

        logger.info(
                "Tracked WhatsApp conversation cost: orgId={}, messageId={}, type={}, cost=${}",
                orgId,
                messageId,
                conversationType.getValue(),
                tracking.getTotalCost());

        return saved;
    }

    @Transactional(readOnly = true)
    public BigDecimal calculateProjectedCostForPeriod(String orgId, LocalDateTime startDate) {
        return costTrackingRepository.sumTotalCostByOrgIdAndCreatedAtAfter(orgId, startDate);
    }

    @Transactional(readOnly = true)
    public Long countConversationsForPeriod(String orgId, LocalDateTime startDate) {
        return costTrackingRepository.countByOrgIdAndCreatedAtAfter(orgId, startDate);
    }

    @Transactional(readOnly = true)
    public Map<String, CostBreakdown> getCostBreakdownByType(String orgId, LocalDateTime startDate) {
        List<Object[]> results =
                costTrackingRepository.findCostBreakdownByOrgIdAndCreatedAtAfter(orgId, startDate);

        Map<String, CostBreakdown> breakdown = new HashMap<>();
        for (Object[] row : results) {
            WhatsAppConversationType type = (WhatsAppConversationType) row[0];
            Long count = ((Number) row[1]).longValue();
            BigDecimal totalCost = (BigDecimal) row[2];

            breakdown.put(
                    type.getValue(),
                    new CostBreakdown(type.getValue(), count, totalCost));
        }

        return breakdown;
    }

    public static class CostBreakdown {
        private final String conversationType;
        private final Long conversationCount;
        private final BigDecimal totalCost;

        public CostBreakdown(String conversationType, Long conversationCount, BigDecimal totalCost) {
            this.conversationType = conversationType;
            this.conversationCount = conversationCount;
            this.totalCost = totalCost;
        }

        public String getConversationType() {
            return conversationType;
        }

        public Long getConversationCount() {
            return conversationCount;
        }

        public BigDecimal getTotalCost() {
            return totalCost;
        }
    }
}
