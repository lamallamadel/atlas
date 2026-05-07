package com.example.backend.service;

import com.example.backend.dto.CreateLotRequest;
import com.example.backend.dto.ProgramLotDto;
import com.example.backend.entity.ProgramLot;
import com.example.backend.entity.RealEstateProgram;
import com.example.backend.entity.enums.LotStatus;
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
public class ProgramLotService {

    private final ProgramLotRepository lotRepository;
    private final RealEstateProgramRepository programRepository;

    public ProgramLotService(ProgramLotRepository lotRepository, RealEstateProgramRepository programRepository) {
        this.lotRepository = lotRepository;
        this.programRepository = programRepository;
    }

    @Transactional
    public ProgramLotDto createLot(Long programId, CreateLotRequest request) {
        String orgId = TenantContext.getOrgId();
        
        RealEstateProgram program = programRepository.findById(programId)
                .filter(p -> p.getOrgId().equals(orgId))
                .orElseThrow(() -> new EntityNotFoundException("Program not found"));

        ProgramLot lot = new ProgramLot();
        lot.setOrgId(orgId);
        lot.setProgram(program);
        lot.setLotNumber(request.getLotNumber());
        lot.setType(request.getType());
        lot.setSurface(request.getSurface());
        lot.setFloorNumber(request.getFloorNumber());
        lot.setBedrooms(request.getBedrooms());
        lot.setBathrooms(request.getBathrooms());
        lot.setPrice(request.getPrice());
        lot.setStatus(LotStatus.AVAILABLE);
        lot.setPlanImageUrl(request.getPlanImageUrl());
        lot.setVirtualTourUrl(request.getVirtualTourUrl());
        
        LocalDateTime now = LocalDateTime.now();
        lot.setCreatedAt(now);
        lot.setUpdatedAt(now);

        ProgramLot saved = lotRepository.save(lot);

        // Update program counters
        program.setTotalLots(program.getTotalLots() + 1);
        program.setAvailableLots(program.getAvailableLots() + 1);
        
        if (program.getMinPrice() == null || request.getPrice().compareTo(program.getMinPrice()) < 0) {
            program.setMinPrice(request.getPrice());
        }
        
        programRepository.save(program);

        return mapToDto(saved);
    }

    @Transactional(readOnly = true)
    public List<ProgramLotDto> getLotsByProgram(Long programId) {
        String orgId = TenantContext.getOrgId();
        return lotRepository.findByProgramId(programId).stream()
                .filter(l -> l.getOrgId().equals(orgId))
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    private ProgramLotDto mapToDto(ProgramLot entity) {
        ProgramLotDto dto = new ProgramLotDto();
        dto.setId(entity.getId());
        dto.setProgramId(entity.getProgram().getId());
        dto.setLotNumber(entity.getLotNumber());
        dto.setType(entity.getType());
        dto.setSurface(entity.getSurface());
        dto.setFloorNumber(entity.getFloorNumber());
        dto.setBedrooms(entity.getBedrooms());
        dto.setBathrooms(entity.getBathrooms());
        dto.setPrice(entity.getPrice());
        dto.setStatus(entity.getStatus());
        dto.setPlanImageUrl(entity.getPlanImageUrl());
        dto.setVirtualTourUrl(entity.getVirtualTourUrl());
        dto.setCreatedAt(entity.getCreatedAt());
        dto.setUpdatedAt(entity.getUpdatedAt());
        return dto;
    }
}
