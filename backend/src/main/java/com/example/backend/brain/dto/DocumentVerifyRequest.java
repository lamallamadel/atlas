package com.example.backend.brain.dto;

import com.fasterxml.jackson.annotation.JsonProperty;

public class DocumentVerifyRequest {
    @JsonProperty("document_id")
    private Long documentId;

    private String category;

    @JsonProperty("file_name")
    private String fileName;

    public Long getDocumentId() {
        return documentId;
    }

    public void setDocumentId(Long documentId) {
        this.documentId = documentId;
    }

    public String getCategory() {
        return category;
    }

    public void setCategory(String category) {
        this.category = category;
    }

    public String getFileName() {
        return fileName;
    }

    public void setFileName(String fileName) {
        this.fileName = fileName;
    }
}
