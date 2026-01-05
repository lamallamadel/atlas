package com.example.backend.dto;

import com.example.backend.entity.DossierStatusHistory;
import org.springframework.stereotype.Component;

@Component
public class DossierStatusHistoryMapper {

    public DossierStatusHistoryResponse toResponse(DossierStatusHistory entity) {
        if (entity == null) {
            return null;
        }

        DossierStatusHistoryResponse response = new DossierStatusHistoryResponse();
        response.setId(entity.getId());
        response.setDossierId(entity.getDossierId());
        response.setFromStatus(entity.getFromStatus());
        response.setToStatus(entity.getToStatus());
        response.setUserId(entity.getUserId());
        response.setReason(entity.getReason());
        response.setTransitionedAt(entity.getTransitionedAt());

        return response;
    }
}
