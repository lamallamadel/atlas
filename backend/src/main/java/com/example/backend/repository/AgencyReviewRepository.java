package com.example.backend.repository;

import com.example.backend.entity.AgencyReviewEntity;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AgencyReviewRepository extends JpaRepository<AgencyReviewEntity, Long> {

    Optional<AgencyReviewEntity> findByMandateId(Long mandateId);

    List<AgencyReviewEntity> findByAgencyOrgIdOrderByCreatedAtDesc(String agencyOrgId);
}
