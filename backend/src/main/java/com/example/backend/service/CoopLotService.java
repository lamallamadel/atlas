package com.example.backend.service;

import com.example.backend.dto.CoopLotMapper;
import com.example.backend.dto.CoopLotRequest;
import com.example.backend.dto.CoopLotResponse;
import com.example.backend.entity.CoopLot;
import com.example.backend.entity.CoopMember;
import com.example.backend.entity.CoopProject;
import com.example.backend.entity.enums.LotStatus;
import com.example.backend.repository.CoopLotRepository;
import com.example.backend.repository.CoopMemberRepository;
import com.example.backend.repository.CoopProjectRepository;
import com.example.backend.util.TenantContext;
import jakarta.persistence.EntityNotFoundException;
import java.time.LocalDateTime;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class CoopLotService {

    private final CoopLotRepository coopLotRepository;
    private final CoopProjectRepository coopProjectRepository;
    private final CoopMemberRepository coopMemberRepository;
    private final CoopLotMapper coopLotMapper;

    public CoopLotService(
            CoopLotRepository coopLotRepository,
            CoopProjectRepository coopProjectRepository,
            CoopMemberRepository coopMemberRepository,
            CoopLotMapper coopLotMapper) {
        this.coopLotRepository = coopLotRepository;
        this.coopProjectRepository = coopProjectRepository;
        this.coopMemberRepository = coopMemberRepository;
        this.coopLotMapper = coopLotMapper;
    }

    @Transactional
    public CoopLotResponse create(CoopLotRequest request) {
        String orgId = TenantContext.getOrgId();
        if (orgId == null) {
            throw new IllegalStateException("Organization ID not found in context");
        }

        CoopProject project =
                coopProjectRepository
                        .findByIdAndOrgId(request.getProjectId(), orgId)
                        .orElseThrow(
                                () ->
                                        new EntityNotFoundException(
                                                "Coop project not found with id: "
                                                        + request.getProjectId()));

        CoopLot lot = coopLotMapper.toEntity(request);
        lot.setOrgId(orgId);
        lot.setProject(project);

        if (request.getMemberId() != null) {
            CoopMember member =
                    coopMemberRepository
                            .findByIdAndOrgId(request.getMemberId(), orgId)
                            .orElseThrow(
                                    () ->
                                            new EntityNotFoundException(
                                                    "Coop member not found with id: "
                                                            + request.getMemberId()));
            lot.setMember(member);
        }

        LocalDateTime now = LocalDateTime.now();
        lot.setCreatedAt(now);
        lot.setUpdatedAt(now);

        CoopLot saved = coopLotRepository.save(lot);
        return coopLotMapper.toResponse(saved);
    }

    @Transactional(readOnly = true)
    public CoopLotResponse getById(Long id) {
        String orgId = TenantContext.getOrgId();
        if (orgId == null) {
            throw new IllegalStateException("Organization ID not found in context");
        }

        CoopLot lot =
                coopLotRepository
                        .findByIdAndOrgId(id, orgId)
                        .orElseThrow(
                                () ->
                                        new EntityNotFoundException(
                                                "Coop lot not found with id: " + id));

        return coopLotMapper.toResponse(lot);
    }

    @Transactional(readOnly = true)
    public Page<CoopLotResponse> list(
            Long projectId, Long memberId, LotStatus status, Pageable pageable) {
        String orgId = TenantContext.getOrgId();
        if (orgId == null) {
            throw new IllegalStateException("Organization ID not found in context");
        }

        Page<CoopLot> lots;
        if (projectId != null) {
            lots = coopLotRepository.findByProjectIdAndOrgId(projectId, orgId, pageable);
        } else if (memberId != null) {
            lots = coopLotRepository.findByMemberIdAndOrgId(memberId, orgId, pageable);
        } else if (status != null) {
            lots = coopLotRepository.findByStatusAndOrgId(status, orgId, pageable);
        } else {
            lots = coopLotRepository.findAll(pageable);
        }

        return lots.map(coopLotMapper::toResponse);
    }

    @Transactional
    public CoopLotResponse update(Long id, CoopLotRequest request) {
        String orgId = TenantContext.getOrgId();
        if (orgId == null) {
            throw new IllegalStateException("Organization ID not found in context");
        }

        CoopLot lot =
                coopLotRepository
                        .findByIdAndOrgId(id, orgId)
                        .orElseThrow(
                                () ->
                                        new EntityNotFoundException(
                                                "Coop lot not found with id: " + id));

        if (request.getProjectId() != null
                && !request.getProjectId().equals(lot.getProject().getId())) {
            CoopProject newProject =
                    coopProjectRepository
                            .findByIdAndOrgId(request.getProjectId(), orgId)
                            .orElseThrow(
                                    () ->
                                            new EntityNotFoundException(
                                                    "Coop project not found with id: "
                                                            + request.getProjectId()));
            lot.setProject(newProject);
        }

        if (request.getMemberId() != null) {
            if (lot.getMember() == null || !request.getMemberId().equals(lot.getMember().getId())) {
                CoopMember newMember =
                        coopMemberRepository
                                .findByIdAndOrgId(request.getMemberId(), orgId)
                                .orElseThrow(
                                        () ->
                                                new EntityNotFoundException(
                                                        "Coop member not found with id: "
                                                                + request.getMemberId()));
                lot.setMember(newMember);
            }
        }

        coopLotMapper.updateEntity(lot, request);
        lot.setUpdatedAt(LocalDateTime.now());

        CoopLot updated = coopLotRepository.save(lot);
        return coopLotMapper.toResponse(updated);
    }

    @Transactional
    public void delete(Long id) {
        String orgId = TenantContext.getOrgId();
        if (orgId == null) {
            throw new IllegalStateException("Organization ID not found in context");
        }

        CoopLot lot =
                coopLotRepository
                        .findByIdAndOrgId(id, orgId)
                        .orElseThrow(
                                () ->
                                        new EntityNotFoundException(
                                                "Coop lot not found with id: " + id));

        coopLotRepository.delete(lot);
    }
}
