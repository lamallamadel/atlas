package com.example.backend.controller;

import com.example.backend.dto.AnnonceResponse;
import com.example.backend.dto.DossierCreateRequest;
import com.example.backend.dto.DossierResponse;
import com.example.backend.entity.Annonce;
import com.example.backend.entity.enums.AnnonceStatus;
import com.example.backend.service.AnnonceService;
import com.example.backend.service.DossierService;
import com.example.backend.util.TenantContext;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/portal")
@Tag(name = "Public Portals", description = "Unauthenticated B2C and B2B portal endpoints (Portail/Vitrine)")
public class PortalPublicController {

    private final AnnonceService annonceService;
    private final DossierService dossierService;

    public PortalPublicController(AnnonceService annonceService, DossierService dossierService) {
        this.annonceService = annonceService;
        this.dossierService = dossierService;
    }

    @GetMapping("/annonces")
    @Operation(summary = "Search public annonces", description = "Search and list published annonces for the Atlasia Portail")
    public ResponseEntity<Page<AnnonceResponse>> searchAnnonces(
            @RequestParam(required = false) String q,
            @RequestParam(required = false) String city,
            @RequestParam(required = false) String type,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "id,desc") String sort) {
        
        // Tenant scope bypass is generally needed for a global portal
        // Since B2C portals are cross-tenant, we set the context to "ORG-001" 
        // OR the AnnonceService already handles it if public. 
        // For MVP, since seed data is 'ORG-001', we inject 'ORG-001'
        TenantContext.setOrgId("ORG-001");
        try {
            String[] sortParams = sort.split(",");
            Sort.Direction direction = sortParams.length > 1 && sortParams[1].equalsIgnoreCase("desc")
                            ? Sort.Direction.DESC
                            : Sort.Direction.ASC;
            Pageable pageable = PageRequest.of(page, size, Sort.by(direction, sortParams[0]));
            
            // Use a global search (cross-tenant) for the public portal
            Page<Annonce> results = annonceService.findAll(AnnonceStatus.PUBLISHED, q, city, type, pageable);
            return ResponseEntity.ok(results.map(annonceService.getAnnonceMapper()::toResponse));
        } finally {
            TenantContext.clear();
        }
    }

    @PostMapping("/leads")
    @Operation(summary = "Submit a portal lead", description = "Submit a contact, demo, or visit request from Vitrine/Portail")
    public ResponseEntity<DossierResponse> submitLead(@Valid @RequestBody DossierCreateRequest request) {
        // Force the lead into the default agency for demo purposes
        TenantContext.setOrgId("ORG-001");
        try {
            // Secure overrides
            if (request.getLeadSource() == null) {
                request.setLeadSource("PORTAIL");
            }
            DossierResponse response = dossierService.create(request);
            return ResponseEntity.status(HttpStatus.CREATED).body(response);
        } finally {
            TenantContext.clear();
        }
    }
}
