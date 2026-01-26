package com.example.backend.controller;

import com.example.backend.dto.*;
import com.example.backend.entity.enums.CommentEntityType;
import com.example.backend.service.CommentExportService;
import com.example.backend.service.CommentService;
import jakarta.validation.Valid;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/comments")
public class CommentController {

    private final CommentService commentService;
    private final CommentExportService exportService;

    public CommentController(CommentService commentService, CommentExportService exportService) {
        this.commentService = commentService;
        this.exportService = exportService;
    }

    @PostMapping("/threads")
    public ResponseEntity<CommentThreadDTO> createThread(
            @Valid @RequestBody CreateCommentThreadRequest request,
            @RequestHeader(value = "X-Org-Id", defaultValue = "default") String orgId,
            @RequestHeader(value = "X-User-Id", defaultValue = "system") String username) {
        CommentThreadDTO thread = commentService.createThread(request, orgId, username);
        return ResponseEntity.status(HttpStatus.CREATED).body(thread);
    }

    @PostMapping
    public ResponseEntity<CommentDTO> addComment(
            @Valid @RequestBody CreateCommentRequest request,
            @RequestHeader(value = "X-Org-Id", defaultValue = "default") String orgId,
            @RequestHeader(value = "X-User-Id", defaultValue = "system") String username) {
        CommentDTO comment = commentService.addComment(request, orgId, username);
        return ResponseEntity.status(HttpStatus.CREATED).body(comment);
    }

    @GetMapping("/threads")
    public ResponseEntity<List<CommentThreadDTO>> getThreadsForEntity(
            @RequestParam CommentEntityType entityType,
            @RequestParam Long entityId) {
        List<CommentThreadDTO> threads = commentService.getThreadsForEntity(entityType, entityId);
        return ResponseEntity.ok(threads);
    }

    @GetMapping("/threads/{threadId}")
    public ResponseEntity<CommentThreadDTO> getThread(@PathVariable Long threadId) {
        CommentThreadDTO thread = commentService.getThread(threadId);
        return ResponseEntity.ok(thread);
    }

    @PostMapping("/threads/{threadId}/resolve")
    public ResponseEntity<CommentThreadDTO> resolveThread(
            @PathVariable Long threadId,
            @RequestHeader(value = "X-User-Id", defaultValue = "system") String username) {
        CommentThreadDTO thread = commentService.resolveThread(threadId, username);
        return ResponseEntity.ok(thread);
    }

    @PostMapping("/threads/{threadId}/unresolve")
    public ResponseEntity<CommentThreadDTO> unresolveThread(
            @PathVariable Long threadId,
            @RequestHeader(value = "X-User-Id", defaultValue = "system") String username) {
        CommentThreadDTO thread = commentService.unresolveThread(threadId, username);
        return ResponseEntity.ok(thread);
    }

    @DeleteMapping("/threads/{threadId}")
    public ResponseEntity<Void> deleteThread(@PathVariable Long threadId) {
        commentService.deleteThread(threadId);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/search")
    public ResponseEntity<List<CommentSearchResult>> searchComments(@RequestParam String query) {
        List<CommentSearchResult> results = commentService.searchComments(query);
        return ResponseEntity.ok(results);
    }

    @GetMapping("/count/unresolved")
    public ResponseEntity<Long> countUnresolvedThreads(
            @RequestParam CommentEntityType entityType,
            @RequestParam Long entityId) {
        long count = commentService.countUnresolvedThreads(entityType, entityId);
        return ResponseEntity.ok(count);
    }

    @GetMapping("/user/{username}")
    public ResponseEntity<List<CommentDTO>> getCommentsByUser(@PathVariable String username) {
        List<CommentDTO> comments = commentService.getCommentsByUser(username);
        return ResponseEntity.ok(comments);
    }

    @GetMapping("/mentions/{username}")
    public ResponseEntity<List<CommentDTO>> getCommentsByMention(@PathVariable String username) {
        List<CommentDTO> comments = commentService.getCommentsByMention(username);
        return ResponseEntity.ok(comments);
    }

    @GetMapping("/export/threads/{threadId}")
    public ResponseEntity<byte[]> exportThread(
            @PathVariable Long threadId,
            @RequestParam(defaultValue = "text") String format) {
        byte[] content;
        String filename;
        MediaType mediaType;

        if ("csv".equalsIgnoreCase(format)) {
            content = exportService.exportThreadToCsv(threadId);
            filename = "comment-thread-" + threadId + ".csv";
            mediaType = MediaType.parseMediaType("text/csv");
        } else {
            content = exportService.exportThreadToText(threadId);
            filename = "comment-thread-" + threadId + ".txt";
            mediaType = MediaType.TEXT_PLAIN;
        }

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(mediaType);
        headers.setContentDispositionFormData("attachment", filename);

        return ResponseEntity.ok()
                .headers(headers)
                .body(content);
    }

    @GetMapping("/export/entity")
    public ResponseEntity<byte[]> exportAllThreadsForEntity(
            @RequestParam CommentEntityType entityType,
            @RequestParam Long entityId) {
        byte[] content = exportService.exportAllThreadsForEntity(entityType, entityId);
        String filename = "comments-" + entityType.name().toLowerCase() + "-" + entityId + ".txt";

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.TEXT_PLAIN);
        headers.setContentDispositionFormData("attachment", filename);

        return ResponseEntity.ok()
                .headers(headers)
                .body(content);
    }
}
