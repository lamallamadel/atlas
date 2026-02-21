package com.example.backend.service;

import com.example.backend.dto.CoopGroupMapper;
import com.example.backend.dto.CoopGroupRequest;
import com.example.backend.dto.CoopGroupResponse;
import com.example.backend.entity.CoopGroup;
import com.example.backend.repository.CoopGroupRepository;
import com.example.backend.util.TenantContext;
import jakarta.persistence.EntityNotFoundException;
import java.time.LocalDateTime;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class CoopGroupService {

    private final CoopGroupRepository coopGroupRepository;
    private final CoopGroupMapper coopGroupMapper;

    public CoopGroupService(
            CoopGroupRepository coopGroupRepository, CoopGroupMapper coopGroupMapper) {
        this.coopGroupRepository = coopGroupRepository;
        this.coopGroupMapper = coopGroupMapper;
    }

    @Transactional
    public CoopGroupResponse create(CoopGroupRequest request) {
        String orgId = TenantContext.getOrgId();
        if (orgId == null) {
            throw new IllegalStateException("Organization ID not found in context");
        }

        CoopGroup group = coopGroupMapper.toEntity(request);
        group.setOrgId(orgId);

        LocalDateTime now = LocalDateTime.now();
        group.setCreatedAt(now);
        group.setUpdatedAt(now);

        CoopGroup saved = coopGroupRepository.save(group);
        return coopGroupMapper.toResponse(saved);
    }

    @Transactional(readOnly = true)
    public CoopGroupResponse getById(Long id) {
        String orgId = TenantContext.getOrgId();
        if (orgId == null) {
            throw new IllegalStateException("Organization ID not found in context");
        }

        CoopGroup group =
                coopGroupRepository
                        .findByIdAndOrgId(id, orgId)
                        .orElseThrow(
                                () ->
                                        new EntityNotFoundException(
                                                "Coop group not found with id: " + id));

        return coopGroupMapper.toResponse(group);
    }

    @Transactional(readOnly = true)
    public Page<CoopGroupResponse> list(Pageable pageable) {
        Page<CoopGroup> groups = coopGroupRepository.findAll(pageable);
        return groups.map(coopGroupMapper::toResponse);
    }

    @Transactional
    public CoopGroupResponse update(Long id, CoopGroupRequest request) {
        String orgId = TenantContext.getOrgId();
        if (orgId == null) {
            throw new IllegalStateException("Organization ID not found in context");
        }

        CoopGroup group =
                coopGroupRepository
                        .findByIdAndOrgId(id, orgId)
                        .orElseThrow(
                                () ->
                                        new EntityNotFoundException(
                                                "Coop group not found with id: " + id));

        coopGroupMapper.updateEntity(group, request);
        group.setUpdatedAt(LocalDateTime.now());

        CoopGroup updated = coopGroupRepository.save(group);
        return coopGroupMapper.toResponse(updated);
    }

    @Transactional
    public void delete(Long id) {
        String orgId = TenantContext.getOrgId();
        if (orgId == null) {
            throw new IllegalStateException("Organization ID not found in context");
        }

        CoopGroup group =
                coopGroupRepository
                        .findByIdAndOrgId(id, orgId)
                        .orElseThrow(
                                () ->
                                        new EntityNotFoundException(
                                                "Coop group not found with id: " + id));

        coopGroupRepository.delete(group);
    }
}
