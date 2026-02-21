package com.example.backend.dto.v2;

import com.example.backend.entity.PartiePrenanteEntity;
import java.time.ZoneOffset;
import org.springframework.stereotype.Component;

@Component
public class PartiePrenanteMapperV2 {

    public PartiePrenanteResponseV2 toResponse(PartiePrenanteEntity entity) {
        PartiePrenanteResponseV2 response = new PartiePrenanteResponseV2();
        response.setId(entity.getId());
        response.setRole(entity.getRole());
        response.setName(entity.getName());
        response.setFirstName(entity.getFirstName());
        response.setLastName(entity.getLastName());
        response.setEmail(entity.getEmail());
        response.setPhone(entity.getPhone());

        if (entity.getCreatedAt() != null) {
            response.setCreatedAt(entity.getCreatedAt().atZone(ZoneOffset.UTC).toInstant());
        }

        return response;
    }
}
