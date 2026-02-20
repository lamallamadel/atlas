package com.example.backend.controller;

import com.example.backend.brain.BrainClientService;
import com.example.backend.brain.dto.ContractGenerateRequest;
import com.example.backend.brain.dto.ContractGenerateResponse;
import com.example.backend.entity.Annonce;
import com.example.backend.entity.Dossier;
import com.example.backend.repository.AnnonceRepository;
import com.example.backend.repository.DossierRepository;
import com.example.backend.util.TenantContext;
import jakarta.persistence.EntityNotFoundException;
import java.util.Optional;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/dossiers/{id}/contract")
public class ContractController {

    private final DossierRepository dossierRepository;
    private final AnnonceRepository annonceRepository;
    private final BrainClientService brainClientService;

    public ContractController(
            DossierRepository dossierRepository,
            AnnonceRepository annonceRepository,
            BrainClientService brainClientService) {
        this.dossierRepository = dossierRepository;
        this.annonceRepository = annonceRepository;
        this.brainClientService = brainClientService;
    }

    @PostMapping("/generate")
    public ResponseEntity<ContractGenerateResponse> generateContract(@PathVariable Long id) {
        String orgId = TenantContext.getOrgId();
        if (orgId == null) {
            return ResponseEntity.status(401).build();
        }

        Dossier dossier = dossierRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Dossier not found"));

        if (!orgId.equals(dossier.getOrgId())) {
            return ResponseEntity.status(403).build();
        }

        Annonce annonce = null;
        if (dossier.getAnnonceId() != null) {
            annonce = annonceRepository.findById(dossier.getAnnonceId()).orElse(null);
        }

        ContractGenerateRequest request = new ContractGenerateRequest();
        request.setDossierId(dossier.getId());
        request.setBuyerName(dossier.getLeadName());

        if (annonce != null) {
            request.setPropertyAddress(annonce.getAddress() + ", " + annonce.getCity());
            request.setAgreedPrice(annonce.getPrice());
        }

        Optional<ContractGenerateResponse> responseOpt = brainClientService.generateContract(request);

        return responseOpt
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.internalServerError().build());
    }
}
