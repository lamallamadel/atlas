package com.example.backend.service;

import com.example.backend.entity.TenantUsageEntity;
import com.example.backend.repository.TenantUsageRepository;
import java.time.LocalDateTime;
import java.time.temporal.TemporalAdjusters;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class TenantUsageTrackingService {

    private static final Logger logger = LoggerFactory.getLogger(TenantUsageTrackingService.class);
    private final TenantUsageRepository usageRepository;

    public TenantUsageTrackingService(TenantUsageRepository usageRepository) {
        this.usageRepository = usageRepository;
    }

    @Transactional
    public void trackMessageSent(String orgId, String channel) {
        TenantUsageEntity usage = getCurrentOrCreateUsage(orgId);

        switch (channel.toLowerCase()) {
            case "email":
                usage.setEmailMessagesSent(usage.getEmailMessagesSent() + 1);
                break;
            case "sms":
                usage.setSmsMessagesSent(usage.getSmsMessagesSent() + 1);
                break;
            case "whatsapp":
                usage.setWhatsappMessagesSent(usage.getWhatsappMessagesSent() + 1);
                break;
        }

        usage.setTotalMessagesSent(
                usage.getEmailMessagesSent()
                        + usage.getSmsMessagesSent()
                        + usage.getWhatsappMessagesSent());

        usageRepository.save(usage);
    }

    @Transactional
    public void trackStorageUsage(String orgId, long documentBytes, long attachmentBytes) {
        TenantUsageEntity usage = getCurrentOrCreateUsage(orgId);

        usage.setDocumentsStorageBytes(usage.getDocumentsStorageBytes() + documentBytes);
        usage.setAttachmentsStorageBytes(usage.getAttachmentsStorageBytes() + attachmentBytes);
        usage.setTotalStorageBytes(
                usage.getDocumentsStorageBytes() + usage.getAttachmentsStorageBytes());

        usageRepository.save(usage);
    }

    @Transactional
    public void trackDossierCreated(String orgId) {
        TenantUsageEntity usage = getCurrentOrCreateUsage(orgId);
        usage.setDossiersCreated(usage.getDossiersCreated() + 1);
        usageRepository.save(usage);
    }

    @Transactional
    public void trackApiCall(String orgId) {
        TenantUsageEntity usage = getCurrentOrCreateUsage(orgId);
        usage.setApiCalls(usage.getApiCalls() + 1);
        usageRepository.save(usage);
    }

    private TenantUsageEntity getCurrentOrCreateUsage(String orgId) {
        LocalDateTime periodStart =
                LocalDateTime.now()
                        .with(TemporalAdjusters.firstDayOfMonth())
                        .withHour(0)
                        .withMinute(0)
                        .withSecond(0);

        return usageRepository
                .findByOrgIdAndPeriodStart(orgId, periodStart)
                .orElseGet(
                        () -> {
                            TenantUsageEntity newUsage = new TenantUsageEntity();
                            newUsage.setOrgId(orgId);
                            newUsage.setPeriodStart(periodStart);
                            newUsage.setPeriodEnd(
                                    periodStart
                                            .with(TemporalAdjusters.lastDayOfMonth())
                                            .withHour(23)
                                            .withMinute(59)
                                            .withSecond(59));
                            return newUsage;
                        });
    }

    public Map<String, Object> getCurrentPeriodUsage(String orgId) {
        LocalDateTime periodStart =
                LocalDateTime.now()
                        .with(TemporalAdjusters.firstDayOfMonth())
                        .withHour(0)
                        .withMinute(0)
                        .withSecond(0);

        TenantUsageEntity usage =
                usageRepository
                        .findByOrgIdAndPeriodStart(orgId, periodStart)
                        .orElse(new TenantUsageEntity());

        Map<String, Object> usageMap = new HashMap<>();
        usageMap.put("periodStart", usage.getPeriodStart());
        usageMap.put("periodEnd", usage.getPeriodEnd());
        usageMap.put("emailMessages", usage.getEmailMessagesSent());
        usageMap.put("smsMessages", usage.getSmsMessagesSent());
        usageMap.put("whatsappMessages", usage.getWhatsappMessagesSent());
        usageMap.put("totalMessages", usage.getTotalMessagesSent());
        usageMap.put("documentsStorageBytes", usage.getDocumentsStorageBytes());
        usageMap.put("attachmentsStorageBytes", usage.getAttachmentsStorageBytes());
        usageMap.put("totalStorageBytes", usage.getTotalStorageBytes());
        usageMap.put("activeUsers", usage.getActiveUsers());
        usageMap.put("apiCalls", usage.getApiCalls());
        usageMap.put("dossiersCreated", usage.getDossiersCreated());

        return usageMap;
    }

    public List<TenantUsageEntity> getUsageHistory(String orgId) {
        return usageRepository.findByOrgIdOrderByPeriodStartDesc(orgId);
    }
}
