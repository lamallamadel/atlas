package com.example.backend.service;

import com.example.backend.dto.CreateReservationRequest;
import com.example.backend.dto.LotReservationDto;
import com.example.backend.entity.Dossier;
import com.example.backend.entity.LotReservation;
import com.example.backend.entity.ProgramLot;
import com.example.backend.entity.RealEstateProgram;
import com.example.backend.entity.enums.LotStatus;
import com.example.backend.entity.enums.ReservationStatus;
import com.example.backend.repository.DossierRepository;
import com.example.backend.repository.LotReservationRepository;
import com.example.backend.repository.ProgramLotRepository;
import com.example.backend.repository.RealEstateProgramRepository;
import com.example.backend.util.TenantContext;
import jakarta.persistence.EntityNotFoundException;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class LotReservationService {

    private final LotReservationRepository reservationRepository;
    private final ProgramLotRepository lotRepository;
    private final DossierRepository dossierRepository;
    private final RealEstateProgramRepository programRepository;

    public LotReservationService(
            LotReservationRepository reservationRepository,
            ProgramLotRepository lotRepository,
            DossierRepository dossierRepository,
            RealEstateProgramRepository programRepository) {
        this.reservationRepository = reservationRepository;
        this.lotRepository = lotRepository;
        this.dossierRepository = dossierRepository;
        this.programRepository = programRepository;
    }

    @Transactional
    public LotReservationDto reserveLot(Long lotId, CreateReservationRequest request) {
        String orgId = TenantContext.getOrgId();

        ProgramLot lot = lotRepository.findById(lotId)
                .filter(l -> l.getOrgId().equals(orgId))
                .orElseThrow(() -> new EntityNotFoundException("Lot not found"));

        if (lot.getStatus() != LotStatus.AVAILABLE) {
            throw new IllegalStateException("Lot is not available for reservation");
        }

        Dossier dossier = dossierRepository.findById(request.getDossierId())
                .filter(d -> d.getOrgId().equals(orgId))
                .orElseThrow(() -> new EntityNotFoundException("Dossier not found"));

        LotReservation reservation = new LotReservation();
        reservation.setOrgId(orgId);
        reservation.setLot(lot);
        reservation.setDossier(dossier);
        reservation.setStatus(ReservationStatus.PENDING);
        reservation.setDepositAmount(request.getDepositAmount());
        
        LocalDateTime now = LocalDateTime.now();
        reservation.setReservationDate(now);
        reservation.setExpiryDate(now.plusDays(7)); // Auto-expire in 7 days if not confirmed
        reservation.setCreatedAt(now);
        reservation.setUpdatedAt(now);

        LotReservation saved = reservationRepository.save(reservation);

        // Update lot status
        lot.setStatus(LotStatus.RESERVED);
        lotRepository.save(lot);

        // Update available lots in program
        RealEstateProgram program = lot.getProgram();
        program.setAvailableLots(program.getAvailableLots() - 1);
        programRepository.save(program);

        return mapToDto(saved);
    }
    
    @Transactional
    public LotReservationDto confirmReservation(Long reservationId) {
        String orgId = TenantContext.getOrgId();
        
        LotReservation reservation = reservationRepository.findById(reservationId)
                .filter(r -> r.getOrgId().equals(orgId))
                .orElseThrow(() -> new EntityNotFoundException("Reservation not found"));
                
        reservation.setStatus(ReservationStatus.CONFIRMED);
        reservation.setUpdatedAt(LocalDateTime.now());
        
        ProgramLot lot = reservation.getLot();
        lot.setStatus(LotStatus.SOLD);
        lotRepository.save(lot);
        
        return mapToDto(reservationRepository.save(reservation));
    }

    @Transactional(readOnly = true)
    public List<LotReservationDto> getReservationsForLot(Long lotId) {
        String orgId = TenantContext.getOrgId();
        return reservationRepository.findByLotId(lotId).stream()
                .filter(r -> r.getOrgId().equals(orgId))
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    private LotReservationDto mapToDto(LotReservation entity) {
        LotReservationDto dto = new LotReservationDto();
        dto.setId(entity.getId());
        dto.setLotId(entity.getLot().getId());
        dto.setDossierId(entity.getDossier().getId());
        dto.setStatus(entity.getStatus());
        dto.setDepositAmount(entity.getDepositAmount());
        dto.setReservationDate(entity.getReservationDate());
        dto.setExpiryDate(entity.getExpiryDate());
        dto.setContractUrl(entity.getContractUrl());
        dto.setCreatedAt(entity.getCreatedAt());
        dto.setUpdatedAt(entity.getUpdatedAt());
        return dto;
    }
}
