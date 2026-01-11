package com.example.backend.service;

import com.example.backend.dto.DossierMapper;
import com.example.backend.dto.DossierResponse;
import com.example.backend.dto.KpiCardDto;
import com.example.backend.entity.Dossier;
import com.example.backend.entity.enums.AnnonceStatus;
import com.example.backend.entity.enums.DossierStatus;
import com.example.backend.repository.AnnonceRepository;
import com.example.backend.repository.DossierRepository;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class DashboardService {

    private final AnnonceRepository annonceRepository;
    private final DossierRepository dossierRepository;
    private final DossierMapper dossierMapper;

    public DashboardService(AnnonceRepository annonceRepository, DossierRepository dossierRepository, DossierMapper dossierMapper) {
        this.annonceRepository = annonceRepository;
        this.dossierRepository = dossierRepository;
        this.dossierMapper = dossierMapper;
    }

    @Transactional(readOnly = true)
    public KpiCardDto getActiveAnnoncesCount(String period) {
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
        
        String trend = calculateTrend(currentCount, previousCount);
        return new KpiCardDto(currentCount, trend);
    }

    @Transactional(readOnly = true)
    public KpiCardDto getDossiersATraiterCount(String period) {
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
        
        String trend = calculateTrend(currentCount, previousCount);
        return new KpiCardDto(currentCount, trend);
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
                return now.minusYears(100); // Return all if period is unknown
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

    private String calculateTrend(Long currentValue, Long previousValue) {
        if (previousValue == 0) {
            if (currentValue > 0) {
                return "+100%";
            }
            return "0%";
        }
        
        double percentageChange = ((double) (currentValue - previousValue) / previousValue) * 100;
        
        if (percentageChange > 0) {
            return String.format("+%.0f%%", percentageChange);
        } else if (percentageChange < 0) {
            return String.format("%.0f%%", percentageChange);
        } else {
            return "0%";
        }
    }

    @Transactional(readOnly = true)
    public List<DossierResponse> getRecentDossiers() {
        Pageable pageable = PageRequest.of(0, 5, Sort.by(Sort.Direction.DESC, "createdAt"));
        List<Dossier> recentDossiers = dossierRepository.findAll(pageable).getContent();
        return recentDossiers.stream()
                .map(dossierMapper::toResponse)
                .collect(Collectors.toList());
    }
}
