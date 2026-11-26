package com.example.backend.repository;

import com.example.backend.entity.PropertyEntity;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PropertyRepository extends JpaRepository<PropertyEntity, Long> {

    List<PropertyEntity> findAllByOrderByCreatedAtDesc();

    /** Biens dont le titre foncier attend un contrôle de la plateforme (lot C). */
    java.util.List<com.example.backend.entity.PropertyEntity>
            findByVerificationStatusOrderByUpdatedAtAsc(String verificationStatus);
}
