package com.example.backend.repository;

import com.example.backend.entity.ImportJobEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ImportJobRepository extends JpaRepository<ImportJobEntity, Long> {
    List<ImportJobEntity> findByOrgIdOrderByCreatedAtDesc(String orgId);
}
