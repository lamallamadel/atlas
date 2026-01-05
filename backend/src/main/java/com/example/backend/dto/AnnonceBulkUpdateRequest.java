package com.example.backend.dto;

import com.example.backend.entity.enums.AnnonceStatus;
import jakarta.validation.constraints.NotEmpty;

import java.util.List;

public class AnnonceBulkUpdateRequest {

    @NotEmpty(message = "IDs list cannot be empty")
    private List<Long> ids;

    private AnnonceUpdates updates;

    public List<Long> getIds() {
        return ids;
    }

    public void setIds(List<Long> ids) {
        this.ids = ids;
    }

    public AnnonceUpdates getUpdates() {
        return updates;
    }

    public void setUpdates(AnnonceUpdates updates) {
        this.updates = updates;
    }

    public static class AnnonceUpdates {
        private AnnonceStatus status;
        private String city;

        public AnnonceStatus getStatus() {
            return status;
        }

        public void setStatus(AnnonceStatus status) {
            this.status = status;
        }

        public String getCity() {
            return city;
        }

        public void setCity(String city) {
            this.city = city;
        }
    }
}
