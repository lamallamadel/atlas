package com.example.backend.repository;

import com.example.backend.entity.ImportJobEntity;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ImportJobRepository extends JpaRepository<ImportJobEntity, Long> {
    List<ImportJobEntity> findByOrgIdOrderByCreatedAtDesc(String orgId);
}
