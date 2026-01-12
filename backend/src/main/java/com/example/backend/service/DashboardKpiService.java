package com.example.backend.service;

import com.example.backend.dto.TrendData;
import com.example.backend.entity.enums.AnnonceStatus;
import com.example.backend.entity.enums.DossierStatus;
import com.example.backend.repository.AnnonceRepository;
import com.example.backend.repository.DossierRepository;
import com.example.backend.util.TenantContext;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
public class DashboardKpiService {

    private static final Logger log = LoggerFactory.getLogger(DashboardKpiService.class);

    private final AnnonceRepository annonceRepository;
    private final DossierRepository dossierRepository;

    public DashboardKpiService(AnnonceRepository annonceRepository, DossierRepository dossierRepository) {
        this.annonceRepository = annonceRepository;
        this.dossierRepository = dossierRepository;
    }

    @Transactional(readOnly = true)
    public Map<String, TrendData> getTrends(String period) {
        String correlationId = UUID.randomUUID().toString();
        log.info("Getting trends with correlationId={}, period={}", correlationId, period);
        
        Map<String, TrendData> trends = new HashMap<>();
        
        try {
            TrendData annoncesActivesTrend = getAnnoncesActivesTrend(period);
            trends.put("annoncesActives", annoncesActivesTrend);
        } catch (Exception e) {
            log.error("Failed to calculate annoncesActives trend. correlationId={}, period={}", 
                correlationId, period, e);
            trends.put("annoncesActives", new TrendData(0L, 0L, 0.0));
        }
        
        try {
            TrendData dossiersATraiterTrend = getDossiersATraiterTrend(period);
            trends.put("dossiersATraiter", dossiersATraiterTrend);
        } catch (Exception e) {
            log.error("Failed to calculate dossiersATraiter trend. correlationId={}, period={}", 
                correlationId, period, e);
            trends.put("dossiersATraiter", new TrendData(0L, 0L, 0.0));
        }
        
        log.info("Successfully calculated trends with correlationId={}, period={}", correlationId, period);
        return trends;
    }

    private TrendData getAnnoncesActivesTrend(String period) {
        String orgId = TenantContext.getOrgId();
        Long currentCount;
        Long previousCount;
        
        if (period == null || period.isEmpty()) {
            Long count = annonceRepository.countByStatusAndOrgId(AnnonceStatus.ACTIVE, orgId);
            currentCount = (count != null) ? count : 0L;
            previousCount = currentCount;
        } else {
            LocalDateTime startDate = getStartDateForPeriod(period);
            LocalDateTime previousStartDate = getPreviousStartDateForPeriod(period, startDate);
            
            if (startDate == null || previousStartDate == null) {
                Long count = annonceRepository.countByStatusAndOrgId(AnnonceStatus.ACTIVE, orgId);
                currentCount = (count != null) ? count : 0L;
                previousCount = currentCount;
            } else {
                Long current = annonceRepository.countByStatusAndCreatedAtAfter(AnnonceStatus.ACTIVE, orgId, startDate);
                currentCount = (current != null) ? current : 0L;
                
                Long previous = annonceRepository.countByStatusAndCreatedAtBetween(
                    AnnonceStatus.ACTIVE,
                    orgId,
                    previousStartDate, 
                    startDate
                );
                previousCount = (previous != null) ? previous : 0L;
            }
        }
        
        Double percentageChange = calculatePercentageChange(currentCount, previousCount);
        return new TrendData(currentCount, previousCount, percentageChange);
    }

    private TrendData getDossiersATraiterTrend(String period) {
        String orgId = TenantContext.getOrgId();
        List<DossierStatus> statusList = Arrays.asList(DossierStatus.NEW, DossierStatus.QUALIFIED);
        
        if (statusList.isEmpty()) {
            return new TrendData(0L, 0L, 0.0);
        }
        
        Long currentCount;
        Long previousCount;
        
        if (period == null || period.isEmpty()) {
            Long count = dossierRepository.countByStatusInAndOrgId(statusList, orgId);
            currentCount = (count != null) ? count : 0L;
            previousCount = currentCount;
        } else {
            LocalDateTime startDate = getStartDateForPeriod(period);
            LocalDateTime previousStartDate = getPreviousStartDateForPeriod(period, startDate);
            
            if (startDate == null || previousStartDate == null) {
                Long count = dossierRepository.countByStatusInAndOrgId(statusList, orgId);
                currentCount = (count != null) ? count : 0L;
                previousCount = currentCount;
            } else {
                Long current = dossierRepository.countByStatusInAndCreatedAtAfter(statusList, orgId, startDate);
                currentCount = (current != null) ? current : 0L;
                
                Long previous = dossierRepository.countByStatusInAndCreatedAtBetween(
                    statusList, 
                    orgId,
                    previousStartDate, 
                    startDate
                );
                previousCount = (previous != null) ? previous : 0L;
            }
        }
        
        Double percentageChange = calculatePercentageChange(currentCount, previousCount);
        return new TrendData(currentCount, previousCount, percentageChange);
    }

    private LocalDateTime getStartDateForPeriod(String period) {
        if (period == null || period.isEmpty()) {
            return null;
        }
        
        LocalDateTime now = LocalDateTime.now();
        
        switch (period) {
            case "TODAY":
                return now.toLocalDate().atStartOfDay();
            case "LAST_7_DAYS":
                return now.minusDays(7);
            case "LAST_30_DAYS":
                return now.minusDays(30);
            default:
                return now.minusYears(100);
        }
    }

    private LocalDateTime getPreviousStartDateForPeriod(String period, LocalDateTime currentStartDate) {
        if (period == null || period.isEmpty() || currentStartDate == null) {
            return null;
        }
        
        switch (period) {
            case "TODAY":
                return currentStartDate.minusDays(1);
            case "LAST_7_DAYS":
                return currentStartDate.minusDays(7);
            case "LAST_30_DAYS":
                return currentStartDate.minusDays(30);
            default:
                return currentStartDate.minusYears(100);
        }
    }

    private Double calculatePercentageChange(Long currentValue, Long previousValue) {
        if (currentValue == null || previousValue == null) {
            return 0.0;
        }
        
        if (previousValue == 0) {
            if (currentValue > 0) {
                return 100.0;
            }
            return 0.0;
        }
        
        return ((double) (currentValue - previousValue) / previousValue) * 100;
    }
}
