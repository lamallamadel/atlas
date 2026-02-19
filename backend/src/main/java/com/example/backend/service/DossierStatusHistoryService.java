package com.example.backend.service;

import com.example.backend.dto.DossierStatusHistoryMapper;
import com.example.backend.dto.DossierStatusHistoryResponse;
import com.example.backend.entity.Dossier;
import com.example.backend.entity.DossierStatusHistory;
import com.example.backend.repository.DossierRepository;
import com.example.backend.repository.DossierStatusHistoryRepository;
import com.example.backend.util.TenantContext;
import jakarta.persistence.EntityNotFoundException;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class DossierStatusHistoryService {

    private final DossierStatusHistoryRepository historyRepository;
    private final DossierRepository dossierRepository;
    private final DossierStatusHistoryMapper historyMapper;

    public DossierStatusHistoryService(
            DossierStatusHistoryRepository historyRepository,
            DossierRepository dossierRepository,
            DossierStatusHistoryMapper historyMapper) {
        this.historyRepository = historyRepository;
        this.dossierRepository = dossierRepository;
        this.historyMapper = historyMapper;
    }

    @Transactional(readOnly = true)
    public Page<DossierStatusHistoryResponse> getStatusHistory(Long dossierId, Pageable pageable) {
        String orgId = TenantContext.getOrgId();
        if (orgId == null) {
            throw new IllegalStateException("Organization ID not found in context");
        }

        Dossier dossier =
                dossierRepository
                        .findById(dossierId)
                        .orElseThrow(
                                () ->
                                        new EntityNotFoundException(
                                                "Dossier not found with id: " + dossierId));

        if (!orgId.equals(dossier.getOrgId())) {
            throw new EntityNotFoundException("Dossier not found with id: " + dossierId);
        }

        Page<DossierStatusHistory> history = historyRepository.findByDossierId(dossierId, pageable);
        return history.map(historyMapper::toResponse);
    }
}
