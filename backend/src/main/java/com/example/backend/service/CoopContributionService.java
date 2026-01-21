package com.example.backend.service;

import com.example.backend.dto.CoopContributionMapper;
import com.example.backend.dto.CoopContributionRequest;
import com.example.backend.dto.CoopContributionResponse;
import com.example.backend.entity.CoopContribution;
import com.example.backend.entity.CoopMember;
import com.example.backend.entity.CoopProject;
import com.example.backend.entity.enums.ContributionStatus;
import com.example.backend.entity.enums.ContributionType;
import com.example.backend.entity.enums.NotificationType;
import com.example.backend.repository.CoopContributionRepository;
import com.example.backend.repository.CoopMemberRepository;
import com.example.backend.repository.CoopProjectRepository;
import com.example.backend.util.TenantContext;
import jakarta.persistence.EntityNotFoundException;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class CoopContributionService {

    private final CoopContributionRepository coopContributionRepository;
    private final CoopMemberRepository coopMemberRepository;
    private final CoopProjectRepository coopProjectRepository;
    private final CoopContributionMapper coopContributionMapper;
    private final NotificationService notificationService;

    public CoopContributionService(CoopContributionRepository coopContributionRepository,
                                  CoopMemberRepository coopMemberRepository,
                                  CoopProjectRepository coopProjectRepository,
                                  CoopContributionMapper coopContributionMapper,
                                  NotificationService notificationService) {
        this.coopContributionRepository = coopContributionRepository;
        this.coopMemberRepository = coopMemberRepository;
        this.coopProjectRepository = coopProjectRepository;
        this.coopContributionMapper = coopContributionMapper;
        this.notificationService = notificationService;
    }

    @Transactional
    public CoopContributionResponse create(CoopContributionRequest request) {
        String orgId = TenantContext.getOrgId();
        if (orgId == null) {
            throw new IllegalStateException("Organization ID not found in context");
        }

        CoopMember member = coopMemberRepository.findByIdAndOrgId(request.getMemberId(), orgId)
                .orElseThrow(() -> new EntityNotFoundException("Coop member not found with id: " + request.getMemberId()));

        CoopContribution contribution = coopContributionMapper.toEntity(request);
        contribution.setOrgId(orgId);
        contribution.setMember(member);

        if (request.getProjectId() != null) {
            CoopProject project = coopProjectRepository.findByIdAndOrgId(request.getProjectId(), orgId)
                    .orElseThrow(() -> new EntityNotFoundException("Coop project not found with id: " + request.getProjectId()));
            contribution.setProject(project);
        }

        LocalDateTime now = LocalDateTime.now();
        contribution.setCreatedAt(now);
        contribution.setUpdatedAt(now);

        CoopContribution saved = coopContributionRepository.save(contribution);

        sendContributionNotification(saved, member);

        return coopContributionMapper.toResponse(saved);
    }

    @Transactional(readOnly = true)
    public CoopContributionResponse getById(Long id) {
        String orgId = TenantContext.getOrgId();
        if (orgId == null) {
            throw new IllegalStateException("Organization ID not found in context");
        }

        CoopContribution contribution = coopContributionRepository.findByIdAndOrgId(id, orgId)
                .orElseThrow(() -> new EntityNotFoundException("Coop contribution not found with id: " + id));

        return coopContributionMapper.toResponse(contribution);
    }

    @Transactional(readOnly = true)
    public Page<CoopContributionResponse> list(Long memberId, Long projectId, ContributionStatus status, ContributionType type, Pageable pageable) {
        String orgId = TenantContext.getOrgId();
        if (orgId == null) {
            throw new IllegalStateException("Organization ID not found in context");
        }

        Page<CoopContribution> contributions;
        if (memberId != null) {
            contributions = coopContributionRepository.findByMemberIdAndOrgId(memberId, orgId, pageable);
        } else if (projectId != null) {
            contributions = coopContributionRepository.findByProjectIdAndOrgId(projectId, orgId, pageable);
        } else if (status != null) {
            contributions = coopContributionRepository.findByStatusAndOrgId(status, orgId, pageable);
        } else if (type != null) {
            contributions = coopContributionRepository.findByTypeAndOrgId(type, orgId, pageable);
        } else {
            contributions = coopContributionRepository.findAll(pageable);
        }

        return contributions.map(coopContributionMapper::toResponse);
    }

    @Transactional
    public CoopContributionResponse update(Long id, CoopContributionRequest request) {
        String orgId = TenantContext.getOrgId();
        if (orgId == null) {
            throw new IllegalStateException("Organization ID not found in context");
        }

        CoopContribution contribution = coopContributionRepository.findByIdAndOrgId(id, orgId)
                .orElseThrow(() -> new EntityNotFoundException("Coop contribution not found with id: " + id));

        if (request.getMemberId() != null && !request.getMemberId().equals(contribution.getMember().getId())) {
            CoopMember newMember = coopMemberRepository.findByIdAndOrgId(request.getMemberId(), orgId)
                    .orElseThrow(() -> new EntityNotFoundException("Coop member not found with id: " + request.getMemberId()));
            contribution.setMember(newMember);
        }

        if (request.getProjectId() != null) {
            if (contribution.getProject() == null || !request.getProjectId().equals(contribution.getProject().getId())) {
                CoopProject newProject = coopProjectRepository.findByIdAndOrgId(request.getProjectId(), orgId)
                        .orElseThrow(() -> new EntityNotFoundException("Coop project not found with id: " + request.getProjectId()));
                contribution.setProject(newProject);
            }
        }

        coopContributionMapper.updateEntity(contribution, request);
        contribution.setUpdatedAt(LocalDateTime.now());

        CoopContribution updated = coopContributionRepository.save(contribution);
        return coopContributionMapper.toResponse(updated);
    }

    @Transactional
    public void delete(Long id) {
        String orgId = TenantContext.getOrgId();
        if (orgId == null) {
            throw new IllegalStateException("Organization ID not found in context");
        }

        CoopContribution contribution = coopContributionRepository.findByIdAndOrgId(id, orgId)
                .orElseThrow(() -> new EntityNotFoundException("Coop contribution not found with id: " + id));

        coopContributionRepository.delete(contribution);
    }

    @Scheduled(cron = "0 0 9 * * ?")
    @Transactional
    public void sendOverdueReminders() {
        LocalDate today = LocalDate.now();
        List<CoopContribution> overdueContributions = coopContributionRepository
                .findByStatusAndDueDateBeforeAndOrgId(ContributionStatus.PENDING, today, TenantContext.getOrgId());

        for (CoopContribution contribution : overdueContributions) {
            sendOverdueNotification(contribution);
        }
    }

    private void sendContributionNotification(CoopContribution contribution, CoopMember member) {
        try {
            Map<String, Object> variables = new HashMap<>();
            variables.put("memberName", member.getFirstName() + " " + member.getLastName());
            variables.put("contributionType", contribution.getType().name());
            variables.put("amount", contribution.getAmount());
            variables.put("currency", contribution.getCurrency());
            variables.put("dueDate", contribution.getDueDate());

            notificationService.createNotification(
                    member.getOrgId(),
                    NotificationType.EMAIL,
                    member.getEmail(),
                    "Contribution Required",
                    "coop-contribution-required",
                    variables
            );
        } catch (Exception e) {
        }
    }

    private void sendOverdueNotification(CoopContribution contribution) {
        try {
            CoopMember member = contribution.getMember();
            Map<String, Object> variables = new HashMap<>();
            variables.put("memberName", member.getFirstName() + " " + member.getLastName());
            variables.put("contributionType", contribution.getType().name());
            variables.put("amount", contribution.getAmount());
            variables.put("currency", contribution.getCurrency());
            variables.put("dueDate", contribution.getDueDate());

            notificationService.createNotification(
                    member.getOrgId(),
                    NotificationType.EMAIL,
                    member.getEmail(),
                    "Overdue Contribution Reminder",
                    "coop-contribution-overdue",
                    variables
            );
        } catch (Exception e) {
        }
    }
}
