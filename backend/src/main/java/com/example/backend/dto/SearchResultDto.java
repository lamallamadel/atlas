package com.example.backend.dto;

import java.time.LocalDateTime;

public class SearchResultDto {
    private Long id;
    private String type;
    private String title;
    private String description;
    private Double relevanceScore;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public SearchResultDto() {}

    public SearchResultDto(
            Long id,
            String type,
            String title,
            String description,
            Double relevanceScore,
            LocalDateTime createdAt,
            LocalDateTime updatedAt) {
        this.id = id;
        this.type = type;
        this.title = title;
        this.description = description;
        this.relevanceScore = relevanceScore;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getType() {
        return type;
    }

    public void setType(String type) {
        this.type = type;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public Double getRelevanceScore() {
        return relevanceScore;
    }

    public void setRelevanceScore(Double relevanceScore) {
        this.relevanceScore = relevanceScore;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(LocalDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }
}
