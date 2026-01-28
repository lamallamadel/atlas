package com.example.backend.dto;

import jakarta.validation.constraints.NotNull;

public class DocumentVersionCompareRequest {

    @NotNull
    private Long documentId;

    @NotNull
    private Integer fromVersion;

    @NotNull
    private Integer toVersion;

    public Long getDocumentId() {
        return documentId;
    }

    public void setDocumentId(Long documentId) {
        this.documentId = documentId;
    }

    public Integer getFromVersion() {
        return fromVersion;
    }

    public void setFromVersion(Integer fromVersion) {
        this.fromVersion = fromVersion;
    }

    public Integer getToVersion() {
        return toVersion;
    }

    public void setToVersion(Integer toVersion) {
        this.toVersion = toVersion;
    }
}
