package com.example.backend.service;

import com.example.backend.entity.CommentEntity;
import com.example.backend.entity.CommentThreadEntity;
import com.example.backend.entity.enums.CommentEntityType;
import com.example.backend.repository.CommentRepository;
import com.example.backend.repository.CommentThreadRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.ByteArrayOutputStream;
import java.io.PrintWriter;
import java.time.format.DateTimeFormatter;
import java.util.List;

@Service
public class CommentExportService {

    private final CommentThreadRepository threadRepository;
    private final CommentRepository commentRepository;

    private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");

    public CommentExportService(CommentThreadRepository threadRepository,
                                CommentRepository commentRepository) {
        this.threadRepository = threadRepository;
        this.commentRepository = commentRepository;
    }

    @Transactional(readOnly = true)
    public byte[] exportThreadToText(Long threadId) {
        CommentThreadEntity thread = threadRepository.findById(threadId)
                .orElseThrow(() -> new RuntimeException("Thread not found: " + threadId));

        List<CommentEntity> comments = commentRepository.findByThreadIdOrderByCreatedAtAsc(threadId);

        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        PrintWriter writer = new PrintWriter(baos);

        writer.println("=".repeat(80));
        writer.println("COMMENT THREAD EXPORT");
        writer.println("=".repeat(80));
        writer.println();
        writer.println("Thread ID: " + thread.getId());
        if (thread.getTitle() != null) {
            writer.println("Title: " + thread.getTitle());
        }
        writer.println("Entity Type: " + thread.getEntityType());
        writer.println("Entity ID: " + thread.getEntityId());
        writer.println("Status: " + (thread.getResolved() ? "RESOLVED" : "OPEN"));
        if (thread.getResolved()) {
            writer.println("Resolved At: " + (thread.getResolvedAt() != null ? 
                    thread.getResolvedAt().format(DATE_FORMATTER) : "N/A"));
            writer.println("Resolved By: " + (thread.getResolvedBy() != null ? thread.getResolvedBy() : "N/A"));
        }
        writer.println("Created At: " + thread.getCreatedAt().format(DATE_FORMATTER));
        writer.println("Created By: " + thread.getCreatedBy());
        writer.println();
        writer.println("=".repeat(80));
        writer.println("COMMENTS (" + comments.size() + " total)");
        writer.println("=".repeat(80));
        writer.println();

        for (int i = 0; i < comments.size(); i++) {
            CommentEntity comment = comments.get(i);
            writer.println("-".repeat(80));
            writer.println("Comment #" + (i + 1));
            writer.println("-".repeat(80));
            writer.println("ID: " + comment.getId());
            writer.println("Author: " + comment.getCreatedBy());
            writer.println("Date: " + comment.getCreatedAt().format(DATE_FORMATTER));
            if (comment.getMentions() != null && !comment.getMentions().isEmpty()) {
                writer.println("Mentions: @" + String.join(", @", comment.getMentions()));
            }
            writer.println();
            writer.println("Content:");
            writer.println(comment.getContent());
            writer.println();
        }

        writer.println("=".repeat(80));
        writer.println("END OF EXPORT");
        writer.println("=".repeat(80));

        writer.flush();
        return baos.toByteArray();
    }

    @Transactional(readOnly = true)
    public byte[] exportAllThreadsForEntity(CommentEntityType entityType, Long entityId) {
        List<CommentThreadEntity> threads = threadRepository
                .findByEntityTypeAndEntityIdOrderByCreatedAtDesc(entityType, entityId);

        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        PrintWriter writer = new PrintWriter(baos);

        writer.println("=".repeat(80));
        writer.println("ALL COMMENT THREADS EXPORT");
        writer.println("=".repeat(80));
        writer.println();
        writer.println("Entity Type: " + entityType);
        writer.println("Entity ID: " + entityId);
        writer.println("Total Threads: " + threads.size());
        writer.println();

        for (int i = 0; i < threads.size(); i++) {
            CommentThreadEntity thread = threads.get(i);
            List<CommentEntity> comments = commentRepository.findByThreadIdOrderByCreatedAtAsc(thread.getId());

            writer.println("=".repeat(80));
            writer.println("THREAD #" + (i + 1));
            writer.println("=".repeat(80));
            writer.println();
            writer.println("Thread ID: " + thread.getId());
            if (thread.getTitle() != null) {
                writer.println("Title: " + thread.getTitle());
            }
            writer.println("Status: " + (thread.getResolved() ? "RESOLVED" : "OPEN"));
            if (thread.getResolved()) {
                writer.println("Resolved At: " + (thread.getResolvedAt() != null ? 
                        thread.getResolvedAt().format(DATE_FORMATTER) : "N/A"));
                writer.println("Resolved By: " + (thread.getResolvedBy() != null ? thread.getResolvedBy() : "N/A"));
            }
            writer.println("Created At: " + thread.getCreatedAt().format(DATE_FORMATTER));
            writer.println("Created By: " + thread.getCreatedBy());
            writer.println("Comments: " + comments.size());
            writer.println();

            for (int j = 0; j < comments.size(); j++) {
                CommentEntity comment = comments.get(j);
                writer.println("-".repeat(80));
                writer.println("  Comment #" + (j + 1));
                writer.println("-".repeat(80));
                writer.println("  Author: " + comment.getCreatedBy());
                writer.println("  Date: " + comment.getCreatedAt().format(DATE_FORMATTER));
                if (comment.getMentions() != null && !comment.getMentions().isEmpty()) {
                    writer.println("  Mentions: @" + String.join(", @", comment.getMentions()));
                }
                writer.println();
                writer.println("  Content:");
                writer.println("  " + comment.getContent().replace("\n", "\n  "));
                writer.println();
            }
        }

        writer.println("=".repeat(80));
        writer.println("END OF EXPORT");
        writer.println("=".repeat(80));

        writer.flush();
        return baos.toByteArray();
    }

    @Transactional(readOnly = true)
    public byte[] exportThreadToCsv(Long threadId) {
        CommentThreadEntity thread = threadRepository.findById(threadId)
                .orElseThrow(() -> new RuntimeException("Thread not found: " + threadId));

        List<CommentEntity> comments = commentRepository.findByThreadIdOrderByCreatedAtAsc(threadId);

        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        PrintWriter writer = new PrintWriter(baos);

        writer.println("Thread ID,Comment ID,Author,Date,Content,Mentions");

        for (CommentEntity comment : comments) {
            writer.print(thread.getId());
            writer.print(",");
            writer.print(comment.getId());
            writer.print(",");
            writer.print(escapeCSV(comment.getCreatedBy()));
            writer.print(",");
            writer.print(comment.getCreatedAt().format(DATE_FORMATTER));
            writer.print(",");
            writer.print(escapeCSV(comment.getContent()));
            writer.print(",");
            writer.print(comment.getMentions() != null ? escapeCSV(String.join(";", comment.getMentions())) : "");
            writer.println();
        }

        writer.flush();
        return baos.toByteArray();
    }

    private String escapeCSV(String value) {
        if (value == null) {
            return "";
        }
        if (value.contains(",") || value.contains("\"") || value.contains("\n")) {
            return "\"" + value.replace("\"", "\"\"") + "\"";
        }
        return value;
    }
}
