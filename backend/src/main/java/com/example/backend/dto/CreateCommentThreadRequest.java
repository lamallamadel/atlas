package com.example.backend.dto;

import com.example.backend.entity.enums.CommentEntityType;
import jakarta.validation.constraints.NotNull;

public class CreateCommentThreadRequest {
    @NotNull private CommentEntityType entityType;

    @NotNull private Long entityId;

    private String title;

    private String initialComment;

    public CommentEntityType getEntityType() {
        return entityType;
    }

    public void setEntityType(CommentEntityType entityType) {
        this.entityType = entityType;
    }

    public Long getEntityId() {
        return entityId;
    }

    public void setEntityId(Long entityId) {
        this.entityId = entityId;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getInitialComment() {
        return initialComment;
    }

    public void setInitialComment(String initialComment) {
        this.initialComment = initialComment;
    }
}
