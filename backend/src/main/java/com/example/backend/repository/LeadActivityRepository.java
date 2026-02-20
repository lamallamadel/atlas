package com.example.backend.repository;

import com.example.backend.entity.LeadActivity;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface LeadActivityRepository extends JpaRepository<LeadActivity, Long> {
    List<LeadActivity> findByDossierIdOrderByCreatedAtDesc(Long dossierId);
}
