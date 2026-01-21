package com.example.backend.dto;

import com.example.backend.entity.ImportJobEntity;
import org.springframework.stereotype.Component;

@Component
public class ImportJobMapper {

    public ImportJobResponse toResponse(ImportJobEntity entity) {
        if (entity == null) {
            return null;
        }

        ImportJobResponse response = new ImportJobResponse();
        response.setId(entity.getId());
        response.setFilename(entity.getFilename());
        response.setStatus(entity.getStatus());
        response.setTotalRows(entity.getTotalRows());
        response.setSuccessCount(entity.getSuccessCount());
        response.setErrorCount(entity.getErrorCount());
        response.setSkippedCount(entity.getSkippedCount());
        response.setErrorReport(entity.getErrorReport());
        response.setCreatedAt(entity.getCreatedAt());
        response.setCreatedBy(entity.getCreatedBy());

        return response;
    }
}
