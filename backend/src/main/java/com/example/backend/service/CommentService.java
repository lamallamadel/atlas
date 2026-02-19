package com.example.backend.service;

import com.example.backend.dto.*;
import com.example.backend.entity.CommentEntity;
import com.example.backend.entity.CommentThreadEntity;
import com.example.backend.entity.enums.CommentEntityType;
import com.example.backend.repository.CommentRepository;
import com.example.backend.repository.CommentThreadRepository;
import jakarta.persistence.EntityNotFoundException;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Collectors;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class CommentService {

    private final CommentThreadRepository threadRepository;
    private final CommentRepository commentRepository;
    private final NotificationService notificationService;

    private static final Pattern MENTION_PATTERN = Pattern.compile("@(\\w+)");

    public CommentService(
            CommentThreadRepository threadRepository,
            CommentRepository commentRepository,
            NotificationService notificationService) {
        this.threadRepository = threadRepository;
        this.commentRepository = commentRepository;
        this.notificationService = notificationService;
    }

    @Transactional
    public CommentThreadDTO createThread(
            CreateCommentThreadRequest request, String orgId, String username) {
        CommentThreadEntity thread = new CommentThreadEntity();
        thread.setEntityType(request.getEntityType());
        thread.setEntityId(request.getEntityId());
        thread.setTitle(request.getTitle());
        thread.setResolved(false);
        thread.setOrgId(orgId);
        thread.setCreatedBy(username);
        thread.setUpdatedBy(username);

        thread = threadRepository.save(thread);

        if (request.getInitialComment() != null && !request.getInitialComment().isBlank()) {
            CommentEntity comment = new CommentEntity();
            comment.setThread(thread);
            comment.setContent(request.getInitialComment());
            comment.setMentions(extractMentions(request.getInitialComment()));
            comment.setOrgId(orgId);
            comment.setCreatedBy(username);
            comment.setUpdatedBy(username);

            commentRepository.save(comment);

            notifyMentionedUsers(comment, thread);
        }

        return toThreadDTO(thread);
    }

    @Transactional
    public CommentDTO addComment(CreateCommentRequest request, String orgId, String username) {
        CommentThreadEntity thread =
                threadRepository
                        .findById(request.getThreadId())
                        .orElseThrow(
                                () ->
                                        new EntityNotFoundException(
                                                "Thread not found: " + request.getThreadId()));

        CommentEntity comment = new CommentEntity();
        comment.setThread(thread);
        comment.setContent(request.getContent());
        comment.setMentions(extractMentions(request.getContent()));
        comment.setOrgId(orgId);
        comment.setCreatedBy(username);
        comment.setUpdatedBy(username);

        comment = commentRepository.save(comment);

        notifyMentionedUsers(comment, thread);
        notifyThreadParticipants(comment, thread, username);

        return toCommentDTO(comment);
    }

    @Transactional(readOnly = true)
    public List<CommentThreadDTO> getThreadsForEntity(CommentEntityType entityType, Long entityId) {
        List<CommentThreadEntity> threads =
                threadRepository.findByEntityTypeAndEntityIdOrderByCreatedAtDesc(
                        entityType, entityId);

        return threads.stream().map(this::toThreadDTO).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public CommentThreadDTO getThread(Long threadId) {
        CommentThreadEntity thread =
                threadRepository
                        .findById(threadId)
                        .orElseThrow(
                                () -> new EntityNotFoundException("Thread not found: " + threadId));
        return toThreadDTO(thread);
    }

    @Transactional
    public CommentThreadDTO resolveThread(Long threadId, String username) {
        CommentThreadEntity thread =
                threadRepository
                        .findById(threadId)
                        .orElseThrow(
                                () -> new EntityNotFoundException("Thread not found: " + threadId));

        thread.setResolved(true);
        thread.setResolvedAt(LocalDateTime.now());
        thread.setResolvedBy(username);
        thread.setUpdatedBy(username);

        thread = threadRepository.save(thread);

        return toThreadDTO(thread);
    }

    @Transactional
    public CommentThreadDTO unresolveThread(Long threadId, String username) {
        CommentThreadEntity thread =
                threadRepository
                        .findById(threadId)
                        .orElseThrow(
                                () -> new EntityNotFoundException("Thread not found: " + threadId));

        thread.setResolved(false);
        thread.setResolvedAt(null);
        thread.setResolvedBy(null);
        thread.setUpdatedBy(username);

        thread = threadRepository.save(thread);

        return toThreadDTO(thread);
    }

    @Transactional(readOnly = true)
    public List<CommentSearchResult> searchComments(String query) {
        List<CommentEntity> comments = commentRepository.searchByContent(query);

        return comments.stream().map(this::toSearchResult).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public long countUnresolvedThreads(CommentEntityType entityType, Long entityId) {
        return threadRepository.countUnresolvedByEntity(entityType, entityId);
    }

    @Transactional
    public void deleteThread(Long threadId) {
        threadRepository.deleteById(threadId);
    }

    @Transactional(readOnly = true)
    public List<CommentDTO> getCommentsByUser(String username) {
        return commentRepository.findByCreatedBy(username).stream()
                .map(this::toCommentDTO)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<CommentDTO> getCommentsByMention(String username) {
        return commentRepository.findByMention(username).stream()
                .map(this::toCommentDTO)
                .collect(Collectors.toList());
    }

    private List<String> extractMentions(String content) {
        List<String> mentions = new ArrayList<>();
        Matcher matcher = MENTION_PATTERN.matcher(content);
        while (matcher.find()) {
            mentions.add(matcher.group(1));
        }
        return mentions;
    }

    private void notifyMentionedUsers(CommentEntity comment, CommentThreadEntity thread) {
        if (comment.getMentions() != null && !comment.getMentions().isEmpty()) {
            for (String mentionedUser : comment.getMentions()) {
                notificationService.createMentionNotification(
                        mentionedUser,
                        comment.getCreatedBy(),
                        thread.getEntityType(),
                        thread.getEntityId(),
                        comment.getId());
            }
        }
    }

    private void notifyThreadParticipants(
            CommentEntity comment, CommentThreadEntity thread, String currentUser) {
        List<CommentEntity> threadComments =
                commentRepository.findByThreadIdOrderByCreatedAtAsc(thread.getId());
        threadComments.stream()
                .map(CommentEntity::getCreatedBy)
                .distinct()
                .filter(user -> !user.equals(currentUser))
                .forEach(
                        user ->
                                notificationService.createCommentNotification(
                                        user,
                                        currentUser,
                                        thread.getEntityType(),
                                        thread.getEntityId(),
                                        comment.getId()));
    }

    private CommentThreadDTO toThreadDTO(CommentThreadEntity entity) {
        CommentThreadDTO dto = new CommentThreadDTO();
        dto.setId(entity.getId());
        dto.setEntityType(entity.getEntityType());
        dto.setEntityId(entity.getEntityId());
        dto.setTitle(entity.getTitle());
        dto.setResolved(entity.getResolved());
        dto.setResolvedAt(entity.getResolvedAt());
        dto.setResolvedBy(entity.getResolvedBy());
        dto.setCreatedAt(entity.getCreatedAt());
        dto.setUpdatedAt(entity.getUpdatedAt());
        dto.setCreatedBy(entity.getCreatedBy());
        dto.setUpdatedBy(entity.getUpdatedBy());

        List<CommentEntity> comments =
                commentRepository.findByThreadIdOrderByCreatedAtAsc(entity.getId());
        dto.setComments(comments.stream().map(this::toCommentDTO).collect(Collectors.toList()));

        return dto;
    }

    private CommentDTO toCommentDTO(CommentEntity entity) {
        CommentDTO dto = new CommentDTO();
        dto.setId(entity.getId());
        dto.setThreadId(entity.getThread() != null ? entity.getThread().getId() : null);
        dto.setContent(entity.getContent());
        dto.setMentions(entity.getMentions() != null ? entity.getMentions() : new ArrayList<>());
        dto.setCreatedAt(entity.getCreatedAt());
        dto.setUpdatedAt(entity.getUpdatedAt());
        dto.setCreatedBy(entity.getCreatedBy());
        dto.setUpdatedBy(entity.getUpdatedBy());
        return dto;
    }

    private CommentSearchResult toSearchResult(CommentEntity comment) {
        CommentSearchResult result = new CommentSearchResult();
        result.setCommentId(comment.getId());
        result.setContent(comment.getContent());
        result.setCreatedAt(comment.getCreatedAt());
        result.setCreatedBy(comment.getCreatedBy());

        if (comment.getThread() != null) {
            result.setThreadId(comment.getThread().getId());
            result.setThreadTitle(comment.getThread().getTitle());
            result.setEntityType(comment.getThread().getEntityType());
            result.setEntityId(comment.getThread().getEntityId());
        }

        return result;
    }
}
