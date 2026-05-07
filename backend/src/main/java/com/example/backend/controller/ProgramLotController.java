package com.example.backend.controller;

import com.example.backend.dto.CreateLotRequest;
import com.example.backend.dto.ProgramLotDto;
import com.example.backend.service.ProgramLotService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/programs/{programId}/lots")
@Tag(name = "Program Lots", description = "API for managing lots within a real estate program")
public class ProgramLotController {

    private final ProgramLotService lotService;

    public ProgramLotController(ProgramLotService lotService) {
        this.lotService = lotService;
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'PRO')")
    @Operation(summary = "Add a lot to a program")
    public ResponseEntity<ProgramLotDto> createLot(
            @PathVariable Long programId,
            @Valid @RequestBody CreateLotRequest request) {
        ProgramLotDto lot = lotService.createLot(programId, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(lot);
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'PRO')")
    @Operation(summary = "List all lots in a program")
    public ResponseEntity<List<ProgramLotDto>> getLotsByProgram(@PathVariable Long programId) {
        return ResponseEntity.ok(lotService.getLotsByProgram(programId));
    }
}
