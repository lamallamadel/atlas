package com.example.backend.controller;

import com.example.backend.dto.OutboundMessageMapper;
import com.example.backend.dto.OutboundMessageRequest;
import com.example.backend.dto.OutboundMessageResponse;
import com.example.backend.entity.OutboundMessageEntity;
import com.example.backend.entity.enums.OutboundMessageStatus;
import com.example.backend.service.OutboundJobWorker;
import com.example.backend.service.OutboundMessageService;
import jakarta.validation.Valid;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/v1/outbound/messages")
public class OutboundMessageController {
    
    private static final Logger logger = LoggerFactory.getLogger(OutboundMessageController.class);
    
    private final OutboundMessageService outboundMessageService;
    private final OutboundMessageMapper outboundMessageMapper;
    private final OutboundJobWorker outboundJobWorker;
    
    public OutboundMessageController(
            OutboundMessageService outboundMessageService,
            OutboundMessageMapper outboundMessageMapper,
            OutboundJobWorker outboundJobWorker) {
        this.outboundMessageService = outboundMessageService;
        this.outboundMessageMapper = outboundMessageMapper;
        this.outboundJobWorker = outboundJobWorker;
    }
    
    @PostMapping
    public ResponseEntity<OutboundMessageResponse> createOutboundMessage(
            @Valid @RequestBody OutboundMessageRequest request,
            @RequestHeader(value = "Idempotency-Key", required = false) String idempotencyKeyHeader) {
        
        String idempotencyKey = request.getIdempotencyKey() != null 
            ? request.getIdempotencyKey() 
            : idempotencyKeyHeader;
        
        logger.info("Creating outbound message: dossierId={}, channel={}, to={}, idempotencyKey={}", 
            request.getDossierId(), request.getChannel(), request.getTo(), idempotencyKey);
        
        OutboundMessageEntity message = outboundMessageService.createOutboundMessage(
            request.getDossierId(),
            request.getChannel(),
            request.getTo(),
            request.getTemplateCode(),
            request.getSubject(),
            request.getPayloadJson(),
            idempotencyKey
        );
        
        OutboundMessageResponse response = outboundMessageMapper.toResponse(message);
        
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }
    
    @GetMapping("/{id}")
    public ResponseEntity<OutboundMessageResponse> getOutboundMessage(@PathVariable Long id) {
        logger.debug("Fetching outbound message: id={}", id);
        
        OutboundMessageEntity message = outboundMessageService.getById(id);
        OutboundMessageResponse response = outboundMessageMapper.toResponse(message);
        
        return ResponseEntity.ok(response);
    }
    
    @GetMapping
    public ResponseEntity<List<OutboundMessageResponse>> listOutboundMessages(
            @RequestParam(required = false) Long dossierId) {
        
        if (dossierId != null) {
            logger.debug("Listing outbound messages for dossier: {}", dossierId);
            List<OutboundMessageEntity> messages = outboundMessageService.listByDossier(dossierId);
            List<OutboundMessageResponse> responses = messages.stream()
                .map(outboundMessageMapper::toResponse)
                .collect(Collectors.toList());
            return ResponseEntity.ok(responses);
        }
        
        return ResponseEntity.badRequest().build();
    }
    
    @GetMapping("/paginated")
    public ResponseEntity<Page<OutboundMessageResponse>> listOutboundMessagesPaginated(
            @RequestParam Long dossierId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "createdAt") String sort,
            @RequestParam(defaultValue = "DESC") String direction) {
        
        logger.debug("Listing outbound messages for dossier: {}, page={}, size={}", dossierId, page, size);
        
        Sort.Direction sortDirection = "ASC".equalsIgnoreCase(direction) ? Sort.Direction.ASC : Sort.Direction.DESC;
        Pageable pageable = PageRequest.of(page, size, Sort.by(sortDirection, sort));
        
        Page<OutboundMessageEntity> messages = outboundMessageService.listByDossierPaginated(dossierId, pageable);
        Page<OutboundMessageResponse> responses = messages.map(outboundMessageMapper::toResponse);
        
        return ResponseEntity.ok(responses);
    }
    
    @PostMapping("/{id}/retry")
    public ResponseEntity<OutboundMessageResponse> retryOutboundMessage(@PathVariable Long id) {
        logger.info("Retrying outbound message: id={}", id);
        
        OutboundMessageEntity message = outboundMessageService.getById(id);
        
        if (message.getStatus() != OutboundMessageStatus.FAILED) {
            logger.warn("Cannot retry message {} with status {}", id, message.getStatus());
            return ResponseEntity.badRequest().build();
        }
        
        message.setStatus(OutboundMessageStatus.QUEUED);
        message.setAttemptCount(0);
        message.setErrorCode(null);
        message.setErrorMessage(null);
        
        OutboundMessageEntity updated = outboundMessageService.updateStatus(
            id, 
            OutboundMessageStatus.QUEUED, 
            null, 
            null
        );
        
        outboundJobWorker.processMessage(updated);
        
        OutboundMessageResponse response = outboundMessageMapper.toResponse(updated);
        return ResponseEntity.ok(response);
    }
}
