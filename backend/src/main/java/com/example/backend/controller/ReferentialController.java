package com.example.backend.controller;

import com.example.backend.aspect.Auditable;
import com.example.backend.dto.ReferentialMapper;
import com.example.backend.dto.ReferentialRequest;
import com.example.backend.dto.ReferentialResponse;
import com.example.backend.entity.ReferentialEntity;
import com.example.backend.service.ReferentialService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import java.util.List;
import java.util.stream.Collectors;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/referentials")
@Tag(name = "Referentials", description = "Tenant-scoped referential data management")
public class ReferentialController {

    private final ReferentialService referentialService;

    public ReferentialController(ReferentialService referentialService) {
        this.referentialService = referentialService;
    }

    @GetMapping
    @Operation(
            summary = "Get all referentials by category",
            description = "Returns all referential items for a given category")
    public ResponseEntity<List<ReferentialResponse>> getAllByCategory(
            @Parameter(
                            description =
                                    "Referential category (e.g., CASE_TYPE, CASE_STATUS, LEAD_SOURCE, LOSS_REASON)")
                    @RequestParam
                    String category,
            @Parameter(description = "Filter only active items")
                    @RequestParam(required = false, defaultValue = "false")
                    boolean activeOnly) {

        List<ReferentialEntity> entities =
                activeOnly
                        ? referentialService.getActiveByCategory(category)
                        : referentialService.getAllByCategory(category);

        List<ReferentialResponse> responses =
                entities.stream().map(ReferentialMapper::toResponse).collect(Collectors.toList());

        return ResponseEntity.ok(responses);
    }

    @GetMapping("/{id}")
    @Operation(
            summary = "Get referential by ID",
            description = "Returns a single referential item by its ID")
    public ResponseEntity<ReferentialResponse> getById(
            @Parameter(description = "Referential ID") @PathVariable Long id) {

        ReferentialEntity entity = referentialService.getById(id);
        return ResponseEntity.ok(ReferentialMapper.toResponse(entity));
    }

    @GetMapping("/by-code")
    @Operation(
            summary = "Get referential by category and code",
            description = "Returns a referential item by its category and code")
    public ResponseEntity<ReferentialResponse> getByCategoryAndCode(
            @Parameter(description = "Referential category") @RequestParam String category,
            @Parameter(description = "Referential code") @RequestParam String code) {

        ReferentialEntity entity = referentialService.getByCategoryAndCode(category, code);
        return ResponseEntity.ok(ReferentialMapper.toResponse(entity));
    }

    @PostMapping
    @Auditable(action = "CREATE", entityType = "REFERENTIAL")
    @Operation(summary = "Create referential", description = "Creates a new referential item")
    public ResponseEntity<ReferentialResponse> create(
            @Parameter(description = "Referential data") @Valid @RequestBody
                    ReferentialRequest request) {

        ReferentialEntity entity = ReferentialMapper.toEntity(request);
        ReferentialEntity created = referentialService.create(entity);

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ReferentialMapper.toResponse(created));
    }

    @PutMapping("/{id}")
    @Auditable(action = "UPDATE", entityType = "REFERENTIAL")
    @Operation(
            summary = "Update referential",
            description = "Updates an existing referential item (system items cannot be modified)")
    public ResponseEntity<ReferentialResponse> update(
            @Parameter(description = "Referential ID") @PathVariable Long id,
            @Parameter(description = "Updated referential data") @Valid @RequestBody
                    ReferentialRequest request) {

        ReferentialEntity entity = ReferentialMapper.toEntity(request);
        ReferentialEntity updated = referentialService.update(id, entity);

        return ResponseEntity.ok(ReferentialMapper.toResponse(updated));
    }

    @DeleteMapping("/{id}")
    @Auditable(action = "DELETE", entityType = "REFERENTIAL")
    @Operation(
            summary = "Delete referential",
            description = "Deletes a referential item (system items cannot be deleted)")
    public ResponseEntity<Void> delete(
            @Parameter(description = "Referential ID") @PathVariable Long id) {

        referentialService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
