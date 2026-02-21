package com.example.backend.service;

import com.example.backend.entity.ApiUsageEntity;
import com.example.backend.repository.ApiUsageRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

@Service
public class ApiUsageTrackingService {

    private final ApiUsageRepository apiUsageRepository;

    public ApiUsageTrackingService(ApiUsageRepository apiUsageRepository) {
        this.apiUsageRepository = apiUsageRepository;
    }

    @Transactional
    public void trackApiUsage(Long apiKeyId, String orgId, String endpoint, 
                             boolean success, double responseTimeMs) {
        LocalDate today = LocalDate.now();
        
        ApiUsageEntity usage = apiUsageRepository
            .findByApiKeyIdAndUsageDateAndEndpoint(apiKeyId, today, endpoint)
            .orElseGet(() -> {
                ApiUsageEntity newUsage = new ApiUsageEntity();
                newUsage.setApiKeyId(apiKeyId);
                newUsage.setOrgId(orgId);
                newUsage.setUsageDate(today);
                newUsage.setEndpoint(endpoint);
                newUsage.setRequestCount(0L);
                newUsage.setSuccessCount(0L);
                newUsage.setErrorCount(0L);
                newUsage.setAvgResponseTimeMs(0.0);
                return newUsage;
            });

        usage.setRequestCount(usage.getRequestCount() + 1);
        if (success) {
            usage.setSuccessCount(usage.getSuccessCount() + 1);
        } else {
            usage.setErrorCount(usage.getErrorCount() + 1);
        }

        double currentAvg = usage.getAvgResponseTimeMs() != null ? usage.getAvgResponseTimeMs() : 0.0;
        long totalRequests = usage.getRequestCount();
        double newAvg = ((currentAvg * (totalRequests - 1)) + responseTimeMs) / totalRequests;
        usage.setAvgResponseTimeMs(newAvg);

        apiUsageRepository.save(usage);
    }

    public List<ApiUsageEntity> getUsageByApiKey(Long apiKeyId, LocalDate startDate, LocalDate endDate) {
        return apiUsageRepository.findByApiKeyIdAndUsageDateBetween(apiKeyId, startDate, endDate);
    }

    public List<ApiUsageEntity> getUsageByOrg(String orgId, LocalDate startDate, LocalDate endDate) {
        return apiUsageRepository.findByOrgIdAndDateRange(orgId, startDate, endDate);
    }

    public Long getTodayRequestCount(Long apiKeyId) {
        LocalDate today = LocalDate.now();
        return apiUsageRepository.sumRequestCountByApiKeyIdAndDate(apiKeyId, today);
    }
}
