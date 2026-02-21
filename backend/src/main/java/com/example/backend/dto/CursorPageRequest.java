package com.example.backend.dto;

import org.springframework.data.domain.Sort;

public class CursorPageRequest {
    private String cursor;
    private Integer limit;
    private Sort.Direction direction;
    private String sortField;

    public CursorPageRequest() {
        this.limit = 20;
        this.direction = Sort.Direction.DESC;
        this.sortField = "id";
    }

    public CursorPageRequest(
            String cursor, Integer limit, Sort.Direction direction, String sortField) {
        this.cursor = cursor;
        this.limit = limit != null ? limit : 20;
        this.direction = direction != null ? direction : Sort.Direction.DESC;
        this.sortField = sortField != null ? sortField : "id";
    }

    public String getCursor() {
        return cursor;
    }

    public void setCursor(String cursor) {
        this.cursor = cursor;
    }

    public Integer getLimit() {
        return limit;
    }

    public void setLimit(Integer limit) {
        this.limit = limit;
    }

    public Sort.Direction getDirection() {
        return direction;
    }

    public void setDirection(Sort.Direction direction) {
        this.direction = direction;
    }

    public String getSortField() {
        return sortField;
    }

    public void setSortField(String sortField) {
        this.sortField = sortField;
    }
}
