package com.example.backend.repository;

import com.example.backend.entity.DataExportRequestEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface DataExportRequestRepository extends JpaRepository<DataExportRequestEntity, Long> {
    List<DataExportRequestEntity> findByOrgIdOrderByCreatedAtDesc(String orgId);
    List<DataExportRequestEntity> findByRequesterEmail(String requesterEmail);
    List<DataExportRequestEntity> findByStatus(String status);
}
