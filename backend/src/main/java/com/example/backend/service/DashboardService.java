package com.example.backend.service;

import com.example.backend.dto.DossierMapper;
import com.example.backend.dto.DossierResponse;
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
    public Long getActiveAnnoncesCount(String period) {
        if (period == null) {
            return annonceRepository.countByStatus(AnnonceStatus.ACTIVE);
        }
        
        LocalDateTime startDate = getStartDateForPeriod(period);
        return annonceRepository.findAll().stream()
                .filter(annonce -> annonce.getStatus() == AnnonceStatus.ACTIVE)
                .filter(annonce -> annonce.getCreatedAt() != null && annonce.getCreatedAt().isAfter(startDate))
                .count();
    }

    @Transactional(readOnly = true)
    public Long getDossiersATraiterCount(String period) {
        List<DossierStatus> statusList = Arrays.asList(DossierStatus.NEW, DossierStatus.QUALIFIED);
        
        if (period == null) {
            return dossierRepository.countByStatusIn(statusList);
        }
        
        LocalDateTime startDate = getStartDateForPeriod(period);
        return dossierRepository.findAll().stream()
                .filter(dossier -> statusList.contains(dossier.getStatus()))
                .filter(dossier -> dossier.getCreatedAt() != null && dossier.getCreatedAt().isAfter(startDate))
                .count();
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

    @Transactional(readOnly = true)
    public List<DossierResponse> getRecentDossiers() {
        Pageable pageable = PageRequest.of(0, 5, Sort.by(Sort.Direction.DESC, "createdAt"));
        List<Dossier> recentDossiers = dossierRepository.findAll(pageable).getContent();
        return recentDossiers.stream()
                .map(dossierMapper::toResponse)
                .collect(Collectors.toList());
    }
}
