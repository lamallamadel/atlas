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
    public Long getActiveAnnoncesCount() {
        return annonceRepository.countByStatus(AnnonceStatus.ACTIVE);
    }

    @Transactional(readOnly = true)
    public Long getDossiersATraiterCount() {
        List<DossierStatus> statusList = Arrays.asList(DossierStatus.NEW, DossierStatus.QUALIFIED);
        return dossierRepository.countByStatusIn(statusList);
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
