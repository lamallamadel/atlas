package com.example.backend.repository;

import com.example.backend.entity.DataExportRequestEntity;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface DataExportRequestRepository extends JpaRepository<DataExportRequestEntity, Long> {
    List<DataExportRequestEntity> findByOrgIdOrderByCreatedAtDesc(String orgId);

    List<DataExportRequestEntity> findByRequesterEmail(String requesterEmail);

    List<DataExportRequestEntity> findByStatus(String status);
}
