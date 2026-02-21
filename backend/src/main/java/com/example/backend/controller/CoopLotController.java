package com.example.backend.controller;

import com.example.backend.dto.CoopLotRequest;
import com.example.backend.dto.CoopLotResponse;
import com.example.backend.entity.enums.LotStatus;
import com.example.backend.service.CoopLotService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/coop/lots")
@Tag(name = "Coop Lots", description = "API for managing cooperative housing lots")
public class CoopLotController {

    private final CoopLotService coopLotService;

    public CoopLotController(CoopLotService coopLotService) {
        this.coopLotService = coopLotService;
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Create a new cooperative lot")
    public ResponseEntity<CoopLotResponse> create(@Valid @RequestBody CoopLotRequest request) {
        CoopLotResponse response = coopLotService.create(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'PRO')")
    @Operation(summary = "Get cooperative lot by ID")
    public ResponseEntity<CoopLotResponse> getById(@PathVariable Long id) {
        CoopLotResponse response = coopLotService.getById(id);
        return ResponseEntity.ok(response);
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'PRO')")
    @Operation(summary = "List cooperative lots")
    public ResponseEntity<Page<CoopLotResponse>> list(
            @RequestParam(required = false) Long projectId,
            @RequestParam(required = false) Long memberId,
            @RequestParam(required = false) LotStatus status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "id,asc") String sort) {
        Pageable pageable = createPageable(page, size, sort);
        Page<CoopLotResponse> response = coopLotService.list(projectId, memberId, status, pageable);
        return ResponseEntity.ok(response);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Update cooperative lot")
    public ResponseEntity<CoopLotResponse> update(
            @PathVariable Long id, @Valid @RequestBody CoopLotRequest request) {
        CoopLotResponse response = coopLotService.update(id, request);
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Delete cooperative lot")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        coopLotService.delete(id);
        return ResponseEntity.noContent().build();
    }

    private Pageable createPageable(int page, int size, String sort) {
        String[] sortParams = sort.split(",");
        String property = sortParams[0];
        Sort.Direction direction =
                sortParams.length > 1 && sortParams[1].equalsIgnoreCase("desc")
                        ? Sort.Direction.DESC
                        : Sort.Direction.ASC;
        return PageRequest.of(page, size, Sort.by(direction, property));
    }
}
