package com.example.backend.controller;

import com.example.backend.dto.CreateProgramRequest;
import com.example.backend.dto.RealEstateProgramDto;
import com.example.backend.entitlement.Feature;
import com.example.backend.entitlement.RequiresFeature;
import com.example.backend.service.RealEstateProgramService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RequiresFeature(Feature.MODULE_NEUF)
@RestController
@RequestMapping("/api/v1/programs")
@Tag(name = "Real Estate Programs", description = "API for managing new real estate developments")
public class RealEstateProgramController {

    private final RealEstateProgramService programService;

    public RealEstateProgramController(RealEstateProgramService programService) {
        this.programService = programService;
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'PRO')")
    @Operation(summary = "Create a new real estate program")
    public ResponseEntity<RealEstateProgramDto> createProgram(
            @Valid @RequestBody CreateProgramRequest request) {
        RealEstateProgramDto program = programService.create(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(program);
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'PRO')")
    @Operation(summary = "List all programs for the organization")
    public ResponseEntity<List<RealEstateProgramDto>> listPrograms() {
        return ResponseEntity.ok(programService.listAll());
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'PRO')")
    @Operation(summary = "Get a specific program by ID")
    public ResponseEntity<RealEstateProgramDto> getProgram(@PathVariable Long id) {
        return ResponseEntity.ok(programService.getById(id));
    }
}
