package com.example.backend.controller;

import com.example.backend.dto.CreateReservationRequest;
import com.example.backend.dto.LotReservationDto;
import com.example.backend.service.LotReservationService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/lots/{lotId}/reservations")
@Tag(name = "Lot Reservations", description = "API for managing online reservations of program lots")
public class LotReservationController {

    private final LotReservationService reservationService;

    public LotReservationController(LotReservationService reservationService) {
        this.reservationService = reservationService;
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'PRO')")
    @Operation(summary = "Reserve a lot", description = "Create a new reservation linking a lot to a lead (dossier)")
    public ResponseEntity<LotReservationDto> reserveLot(
            @PathVariable Long lotId,
            @Valid @RequestBody CreateReservationRequest request) {
        LotReservationDto reservation = reservationService.reserveLot(lotId, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(reservation);
    }

    @PostMapping("/{reservationId}/confirm")
    @PreAuthorize("hasAnyRole('ADMIN', 'PRO')")
    @Operation(summary = "Confirm a reservation", description = "Marks a reservation as confirmed and the lot as sold")
    public ResponseEntity<LotReservationDto> confirmReservation(
            @PathVariable Long lotId,
            @PathVariable Long reservationId) {
        // lotId is part of the path for hierarchical consistency, though not strictly required if reservationId is unique
        return ResponseEntity.ok(reservationService.confirmReservation(reservationId));
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'PRO')")
    @Operation(summary = "List reservations for a lot")
    public ResponseEntity<List<LotReservationDto>> getReservations(@PathVariable Long lotId) {
        return ResponseEntity.ok(reservationService.getReservationsForLot(lotId));
    }
}
