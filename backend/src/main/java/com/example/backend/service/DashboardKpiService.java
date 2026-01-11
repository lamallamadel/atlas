package com.example.backend.service;

import com.example.backend.dto.TrendData;
import com.example.backend.entity.enums.AnnonceStatus;
import com.example.backend.entity.enums.DossierStatus;
import com.example.backend.repository.AnnonceRepository;
import com.example.backend.repository.DossierRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class DashboardKpiService {

    private final AnnonceRepository annonceRepository;
    private final DossierRepository dossierRepository;

    public DashboardKpiService(AnnonceRepository annonceRepository, DossierRepository dossierRepository) {
        this.annonceRepository = annonceRepository;
        this.dossierRepository = dossierRepository;
    }

    @Transactional(readOnly = true)
    public Map<String, TrendData> getTrends(String period) {
        Map<String, TrendData> trends = new HashMap<>();
        
        trends.put("annoncesActives", getAnnoncesActivesTrend(period));
        trends.put("dossiersATraiter", getDossiersATraiterTrend(period));
        
        return trends;
    }

    private TrendData getAnnoncesActivesTrend(String period) {
        Long currentCount;
        Long previousCount;
        
        if (period == null) {
            currentCount = annonceRepository.countByStatus(AnnonceStatus.ACTIVE);
            previousCount = currentCount;
        } else {
            LocalDateTime startDate = getStartDateForPeriod(period);
            LocalDateTime previousStartDate = getPreviousStartDateForPeriod(period, startDate);
            
            currentCount = annonceRepository.findAll().stream()
                    .filter(annonce -> annonce.getStatus() == AnnonceStatus.ACTIVE)
                    .filter(annonce -> annonce.getCreatedAt() != null && annonce.getCreatedAt().isAfter(startDate))
                    .count();
            
            previousCount = annonceRepository.findAll().stream()
                    .filter(annonce -> annonce.getStatus() == AnnonceStatus.ACTIVE)
                    .filter(annonce -> annonce.getCreatedAt() != null 
                            && annonce.getCreatedAt().isAfter(previousStartDate) 
                            && annonce.getCreatedAt().isBefore(startDate))
                    .count();
        }
        
        Double percentageChange = calculatePercentageChange(currentCount, previousCount);
        return new TrendData(currentCount, previousCount, percentageChange);
    }

    private TrendData getDossiersATraiterTrend(String period) {
        List<DossierStatus> statusList = Arrays.asList(DossierStatus.NEW, DossierStatus.QUALIFIED);
        Long currentCount;
        Long previousCount;
        
        if (period == null) {
            currentCount = dossierRepository.countByStatusIn(statusList);
            previousCount = currentCount;
        } else {
            LocalDateTime startDate = getStartDateForPeriod(period);
            LocalDateTime previousStartDate = getPreviousStartDateForPeriod(period, startDate);
            
            currentCount = dossierRepository.findAll().stream()
                    .filter(dossier -> statusList.contains(dossier.getStatus()))
                    .filter(dossier -> dossier.getCreatedAt() != null && dossier.getCreatedAt().isAfter(startDate))
                    .count();
            
            previousCount = dossierRepository.findAll().stream()
                    .filter(dossier -> statusList.contains(dossier.getStatus()))
                    .filter(dossier -> dossier.getCreatedAt() != null 
                            && dossier.getCreatedAt().isAfter(previousStartDate) 
                            && dossier.getCreatedAt().isBefore(startDate))
                    .count();
        }
        
        Double percentageChange = calculatePercentageChange(currentCount, previousCount);
        return new TrendData(currentCount, previousCount, percentageChange);
    }

    private LocalDateTime getStartDateForPeriod(String period) {
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
        if (previousValue == 0) {
            if (currentValue > 0) {
                return 100.0;
            }
            return 0.0;
        }
        
        return ((double) (currentValue - previousValue) / previousValue) * 100;
    }
}
