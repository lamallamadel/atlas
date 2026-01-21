package com.example.backend.service;

import com.example.backend.dto.CoopProjectMapper;
import com.example.backend.dto.CoopProjectRequest;
import com.example.backend.dto.CoopProjectResponse;
import com.example.backend.entity.CoopGroup;
import com.example.backend.entity.CoopProject;
import com.example.backend.entity.enums.ProjectStatus;
import com.example.backend.repository.CoopGroupRepository;
import com.example.backend.repository.CoopProjectRepository;
import com.example.backend.util.TenantContext;
import jakarta.persistence.EntityNotFoundException;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Service
public class CoopProjectService {

    private final CoopProjectRepository coopProjectRepository;
    private final CoopGroupRepository coopGroupRepository;
    private final CoopProjectMapper coopProjectMapper;

    public CoopProjectService(CoopProjectRepository coopProjectRepository,
                             CoopGroupRepository coopGroupRepository,
                             CoopProjectMapper coopProjectMapper) {
        this.coopProjectRepository = coopProjectRepository;
        this.coopGroupRepository = coopGroupRepository;
        this.coopProjectMapper = coopProjectMapper;
    }

    @Transactional
    public CoopProjectResponse create(CoopProjectRequest request) {
        String orgId = TenantContext.getOrgId();
        if (orgId == null) {
            throw new IllegalStateException("Organization ID not found in context");
        }

        CoopGroup group = coopGroupRepository.findByIdAndOrgId(request.getGroupId(), orgId)
                .orElseThrow(() -> new EntityNotFoundException("Coop group not found with id: " + request.getGroupId()));

        CoopProject project = coopProjectMapper.toEntity(request);
        project.setOrgId(orgId);
        project.setGroup(group);

        LocalDateTime now = LocalDateTime.now();
        project.setCreatedAt(now);
        project.setUpdatedAt(now);

        CoopProject saved = coopProjectRepository.save(project);
        return coopProjectMapper.toResponse(saved);
    }

    @Transactional(readOnly = true)
    public CoopProjectResponse getById(Long id) {
        String orgId = TenantContext.getOrgId();
        if (orgId == null) {
            throw new IllegalStateException("Organization ID not found in context");
        }

        CoopProject project = coopProjectRepository.findByIdAndOrgId(id, orgId)
                .orElseThrow(() -> new EntityNotFoundException("Coop project not found with id: " + id));

        return coopProjectMapper.toResponse(project);
    }

    @Transactional(readOnly = true)
    public Page<CoopProjectResponse> list(Long groupId, ProjectStatus status, Pageable pageable) {
        String orgId = TenantContext.getOrgId();
        if (orgId == null) {
            throw new IllegalStateException("Organization ID not found in context");
        }

        Page<CoopProject> projects;
        if (groupId != null) {
            projects = coopProjectRepository.findByGroupIdAndOrgId(groupId, orgId, pageable);
        } else if (status != null) {
            projects = coopProjectRepository.findByStatusAndOrgId(status, orgId, pageable);
        } else {
            projects = coopProjectRepository.findAll(pageable);
        }

        return projects.map(coopProjectMapper::toResponse);
    }

    @Transactional
    public CoopProjectResponse update(Long id, CoopProjectRequest request) {
        String orgId = TenantContext.getOrgId();
        if (orgId == null) {
            throw new IllegalStateException("Organization ID not found in context");
        }

        CoopProject project = coopProjectRepository.findByIdAndOrgId(id, orgId)
                .orElseThrow(() -> new EntityNotFoundException("Coop project not found with id: " + id));

        if (request.getGroupId() != null && !request.getGroupId().equals(project.getGroup().getId())) {
            CoopGroup newGroup = coopGroupRepository.findByIdAndOrgId(request.getGroupId(), orgId)
                    .orElseThrow(() -> new EntityNotFoundException("Coop group not found with id: " + request.getGroupId()));
            project.setGroup(newGroup);
        }

        coopProjectMapper.updateEntity(project, request);
        project.setUpdatedAt(LocalDateTime.now());

        CoopProject updated = coopProjectRepository.save(project);
        return coopProjectMapper.toResponse(updated);
    }

    @Transactional
    public void delete(Long id) {
        String orgId = TenantContext.getOrgId();
        if (orgId == null) {
            throw new IllegalStateException("Organization ID not found in context");
        }

        CoopProject project = coopProjectRepository.findByIdAndOrgId(id, orgId)
                .orElseThrow(() -> new EntityNotFoundException("Coop project not found with id: " + id));

        coopProjectRepository.delete(project);
    }
}
