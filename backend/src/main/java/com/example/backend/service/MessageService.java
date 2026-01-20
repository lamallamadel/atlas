package com.example.backend.service;

import com.example.backend.dto.MessageCreateRequest;
import com.example.backend.dto.MessageMapper;
import com.example.backend.dto.MessageResponse;
import com.example.backend.entity.Dossier;
import com.example.backend.entity.MessageEntity;
import com.example.backend.entity.enums.MessageChannel;
import com.example.backend.entity.enums.MessageDirection;
import com.example.backend.repository.DossierRepository;
import com.example.backend.repository.MessageRepository;
import com.example.backend.util.TenantContext;
import jakarta.persistence.EntityManager;
import jakarta.persistence.EntityNotFoundException;
import org.hibernate.Session;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Service
public class MessageService {

    private final MessageRepository messageRepository;
    private final DossierRepository dossierRepository;
    private final MessageMapper messageMapper;
    private final EntityManager entityManager;

    public MessageService(MessageRepository messageRepository, DossierRepository dossierRepository, MessageMapper messageMapper, EntityManager entityManager) {
        this.messageRepository = messageRepository;
        this.dossierRepository = dossierRepository;
        this.messageMapper = messageMapper;
        this.entityManager = entityManager;
    }

    @Transactional
    public MessageResponse create(MessageCreateRequest request) {
        String orgId = TenantContext.getOrgId();
        if (orgId == null) {
            throw new IllegalStateException("Organization ID not found in context");
        }

        Dossier dossier = dossierRepository.findById(request.getDossierId())
                .orElseThrow(() -> new EntityNotFoundException("Dossier not found with id: " + request.getDossierId()));

        if (!orgId.equals(dossier.getOrgId())) {
            throw new EntityNotFoundException("Dossier not found with id: " + request.getDossierId());
        }

        MessageEntity message = messageMapper.toEntity(request, dossier, orgId);
        
        LocalDateTime now = LocalDateTime.now();
        message.setCreatedAt(now);
        message.setUpdatedAt(now);
        
        MessageEntity saved = messageRepository.save(message);
        return messageMapper.toResponse(saved);
    }

    @Transactional(readOnly = true)
    public MessageResponse getById(Long id) {
        String orgId = TenantContext.getOrgId();
        if (orgId == null) {
            throw new IllegalStateException("Organization ID not found in context");
        }

        MessageEntity message = messageRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Message not found with id: " + id));

        if (!orgId.equals(message.getOrgId())) {
            throw new EntityNotFoundException("Message not found with id: " + id);
        }

        return messageMapper.toResponse(message);
    }

    @Transactional(readOnly = true)
    public Page<MessageResponse> listByDossier(Long dossierId, MessageChannel channel, MessageDirection direction, java.time.LocalDateTime startDate, java.time.LocalDateTime endDate, Pageable pageable) {
        String orgId = TenantContext.getOrgId();
        if (orgId == null) {
            throw new IllegalStateException("Organization ID not found in context");
        }

        Dossier dossier = dossierRepository.findById(dossierId)
                .orElseThrow(() -> new EntityNotFoundException("Dossier not found with id: " + dossierId));

        if (!orgId.equals(dossier.getOrgId())) {
            throw new EntityNotFoundException("Dossier not found with id: " + dossierId);
        }

        // Explicitly enable Hibernate filter for multi-tenant filtering
        entityManager.unwrap(Session.class)
                .enableFilter("orgIdFilter")
                .setParameter("orgId", orgId);

        Page<MessageEntity> messages = messageRepository.findByDossierIdWithFilters(dossierId, channel, direction, startDate, endDate, pageable);
        return messages.map(messageMapper::toResponse);
    }

    @Transactional
    public void delete(Long id) {
        String orgId = TenantContext.getOrgId();
        if (orgId == null) {
            throw new IllegalStateException("Organization ID not found in context");
        }

        MessageEntity message = messageRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Message not found with id: " + id));

        if (!orgId.equals(message.getOrgId())) {
            throw new EntityNotFoundException("Message not found with id: " + id);
        }

        messageRepository.delete(message);
    }
}
