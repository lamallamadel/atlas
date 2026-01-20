package com.example.backend.dto;

import com.example.backend.entity.DocumentEntity;
import org.springframework.stereotype.Component;

@Component
public class DocumentMapper {

    public DocumentResponse toResponse(DocumentEntity entity) {
        if (entity == null) {
            return null;
        }

        DocumentResponse response = new DocumentResponse();
        response.setId(entity.getId());
        response.setOrgId(entity.getOrgId());
        response.setDossierId(entity.getDossierId());
        response.setFileName(entity.getFileName());
        response.setFileType(entity.getFileType());
        response.setFileSize(entity.getFileSize());
        response.setStoragePath(entity.getStoragePath());
        response.setUploadedBy(entity.getUploadedBy());
        response.setContentType(entity.getContentType());
        response.setCategory(entity.getCategory());
        response.setCreatedAt(entity.getCreatedAt());
        response.setUpdatedAt(entity.getUpdatedAt());

        return response;
    }
}
