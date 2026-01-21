package com.example.backend.repository;

import com.example.backend.entity.CoopProject;
import com.example.backend.entity.enums.ProjectStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface CoopProjectRepository extends JpaRepository<CoopProject, Long>, JpaSpecificationExecutor<CoopProject> {

    Optional<CoopProject> findByIdAndOrgId(Long id, String orgId);

    Page<CoopProject> findByGroupIdAndOrgId(Long groupId, String orgId, Pageable pageable);

    Page<CoopProject> findByStatusAndOrgId(ProjectStatus status, String orgId, Pageable pageable);
}
