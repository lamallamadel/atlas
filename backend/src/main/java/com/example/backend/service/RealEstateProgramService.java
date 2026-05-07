package com.example.backend.service;

import com.example.backend.dto.CreateProgramRequest;
import com.example.backend.dto.RealEstateProgramDto;
import com.example.backend.entity.RealEstateProgram;
import com.example.backend.entity.enums.ProgramStatus;
import com.example.backend.repository.RealEstateProgramRepository;
import com.example.backend.util.TenantContext;
import jakarta.persistence.EntityNotFoundException;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class RealEstateProgramService {

    private final RealEstateProgramRepository repository;

    public RealEstateProgramService(RealEstateProgramRepository repository) {
        this.repository = repository;
    }

    @Transactional
    public RealEstateProgramDto create(CreateProgramRequest request) {
        String orgId = TenantContext.getOrgId();
        if (orgId == null) {
            throw new IllegalStateException("Organization ID is required");
        }

        RealEstateProgram program = new RealEstateProgram();
        program.setOrgId(orgId);
        program.setName(request.getName());
        program.setDescription(request.getDescription());
        program.setLocation(request.getLocation());
        program.setCity(request.getCity());
        program.setDeliveryDate(request.getDeliveryDate());
        program.setStatus(ProgramStatus.DRAFT);
        
        LocalDateTime now = LocalDateTime.now();
        program.setCreatedAt(now);
        program.setUpdatedAt(now);

        return mapToDto(repository.save(program));
    }

    @Transactional(readOnly = true)
    public List<RealEstateProgramDto> listAll() {
        String orgId = TenantContext.getOrgId();
        return repository.findByOrgId(orgId).stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public RealEstateProgramDto getById(Long id) {
        String orgId = TenantContext.getOrgId();
        RealEstateProgram program = repository.findById(id)
                .filter(p -> p.getOrgId().equals(orgId))
                .orElseThrow(() -> new EntityNotFoundException("Program not found"));
        return mapToDto(program);
    }

    private RealEstateProgramDto mapToDto(RealEstateProgram entity) {
        RealEstateProgramDto dto = new RealEstateProgramDto();
        dto.setId(entity.getId());
        dto.setName(entity.getName());
        dto.setDescription(entity.getDescription());
        dto.setLocation(entity.getLocation());
        dto.setCity(entity.getCity());
        dto.setStatus(entity.getStatus());
        dto.setDeliveryDate(entity.getDeliveryDate());
        dto.setTotalLots(entity.getTotalLots());
        dto.setAvailableLots(entity.getAvailableLots());
        dto.setMinPrice(entity.getMinPrice());
        dto.setCurrency(entity.getCurrency());
        dto.setBrochureUrl(entity.getBrochureUrl());
        dto.setCreatedAt(entity.getCreatedAt());
        dto.setUpdatedAt(entity.getUpdatedAt());
        return dto;
    }
}
