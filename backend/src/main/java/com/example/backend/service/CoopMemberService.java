package com.example.backend.service;

import com.example.backend.dto.CoopMemberMapper;
import com.example.backend.dto.CoopMemberRequest;
import com.example.backend.dto.CoopMemberResponse;
import com.example.backend.entity.CoopGroup;
import com.example.backend.entity.CoopMember;
import com.example.backend.entity.enums.MemberStatus;
import com.example.backend.entity.enums.NotificationType;
import com.example.backend.repository.CoopGroupRepository;
import com.example.backend.repository.CoopMemberRepository;
import com.example.backend.util.TenantContext;
import jakarta.persistence.EntityNotFoundException;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class CoopMemberService {

    private final CoopMemberRepository coopMemberRepository;
    private final CoopGroupRepository coopGroupRepository;
    private final CoopMemberMapper coopMemberMapper;
    private final NotificationService notificationService;

    public CoopMemberService(
            CoopMemberRepository coopMemberRepository,
            CoopGroupRepository coopGroupRepository,
            CoopMemberMapper coopMemberMapper,
            NotificationService notificationService) {
        this.coopMemberRepository = coopMemberRepository;
        this.coopGroupRepository = coopGroupRepository;
        this.coopMemberMapper = coopMemberMapper;
        this.notificationService = notificationService;
    }

    @Transactional
    public CoopMemberResponse create(CoopMemberRequest request) {
        String orgId = TenantContext.getOrgId();
        if (orgId == null) {
            throw new IllegalStateException("Organization ID not found in context");
        }

        CoopGroup group =
                coopGroupRepository
                        .findByIdAndOrgId(request.getGroupId(), orgId)
                        .orElseThrow(
                                () ->
                                        new EntityNotFoundException(
                                                "Coop group not found with id: "
                                                        + request.getGroupId()));

        CoopMember member = coopMemberMapper.toEntity(request);
        member.setOrgId(orgId);
        member.setGroup(group);

        LocalDateTime now = LocalDateTime.now();
        member.setCreatedAt(now);
        member.setUpdatedAt(now);

        CoopMember saved = coopMemberRepository.save(member);

        sendWelcomeNotification(saved, group);

        return coopMemberMapper.toResponse(saved);
    }

    @Transactional(readOnly = true)
    public CoopMemberResponse getById(Long id) {
        String orgId = TenantContext.getOrgId();
        if (orgId == null) {
            throw new IllegalStateException("Organization ID not found in context");
        }

        CoopMember member =
                coopMemberRepository
                        .findByIdAndOrgId(id, orgId)
                        .orElseThrow(
                                () ->
                                        new EntityNotFoundException(
                                                "Coop member not found with id: " + id));

        return coopMemberMapper.toResponse(member);
    }

    @Transactional(readOnly = true)
    public Page<CoopMemberResponse> list(Long groupId, MemberStatus status, Pageable pageable) {
        String orgId = TenantContext.getOrgId();
        if (orgId == null) {
            throw new IllegalStateException("Organization ID not found in context");
        }

        Page<CoopMember> members;
        if (groupId != null) {
            members = coopMemberRepository.findByGroupIdAndOrgId(groupId, orgId, pageable);
        } else if (status != null) {
            members = coopMemberRepository.findByStatusAndOrgId(status, orgId, pageable);
        } else {
            members = coopMemberRepository.findAll(pageable);
        }

        return members.map(coopMemberMapper::toResponse);
    }

    @Transactional
    public CoopMemberResponse update(Long id, CoopMemberRequest request) {
        String orgId = TenantContext.getOrgId();
        if (orgId == null) {
            throw new IllegalStateException("Organization ID not found in context");
        }

        CoopMember member =
                coopMemberRepository
                        .findByIdAndOrgId(id, orgId)
                        .orElseThrow(
                                () ->
                                        new EntityNotFoundException(
                                                "Coop member not found with id: " + id));

        if (request.getGroupId() != null
                && !request.getGroupId().equals(member.getGroup().getId())) {
            CoopGroup newGroup =
                    coopGroupRepository
                            .findByIdAndOrgId(request.getGroupId(), orgId)
                            .orElseThrow(
                                    () ->
                                            new EntityNotFoundException(
                                                    "Coop group not found with id: "
                                                            + request.getGroupId()));
            member.setGroup(newGroup);
        }

        coopMemberMapper.updateEntity(member, request);
        member.setUpdatedAt(LocalDateTime.now());

        CoopMember updated = coopMemberRepository.save(member);
        return coopMemberMapper.toResponse(updated);
    }

    @Transactional
    public void delete(Long id) {
        String orgId = TenantContext.getOrgId();
        if (orgId == null) {
            throw new IllegalStateException("Organization ID not found in context");
        }

        CoopMember member =
                coopMemberRepository
                        .findByIdAndOrgId(id, orgId)
                        .orElseThrow(
                                () ->
                                        new EntityNotFoundException(
                                                "Coop member not found with id: " + id));

        coopMemberRepository.delete(member);
    }

    private void sendWelcomeNotification(CoopMember member, CoopGroup group) {
        try {
            Map<String, Object> variables = new HashMap<>();
            variables.put("firstName", member.getFirstName());
            variables.put("lastName", member.getLastName());
            variables.put("groupName", group.getName());
            variables.put("memberNumber", member.getMemberNumber());

            notificationService.createNotification(
                    member.getOrgId(),
                    NotificationType.EMAIL,
                    member.getEmail(),
                    "Welcome to " + group.getName(),
                    "coop-member-welcome",
                    variables);
        } catch (Exception e) {
        }
    }
}
