package com.example.backend.repository;

import com.example.backend.entity.MandateOfferEntity;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface MandateOfferRepository extends JpaRepository<MandateOfferEntity, Long> {

    List<MandateOfferEntity> findByMandateIdOrderByCreatedAtDesc(Long mandateId);

    boolean existsByMandateIdAndStatus(Long mandateId, String status);
}
