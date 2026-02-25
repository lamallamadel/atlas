package com.example.backend.repository;

import com.example.backend.entity.DocumentVersionEntity;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface DocumentVersionRepository extends JpaRepository<DocumentVersionEntity, Long> {

    Optional<DocumentVersionEntity> findByIdAndOrgId(Long id, String orgId);

    List<DocumentVersionEntity> findByDocumentIdAndOrgIdOrderByVersionNumberDesc(
            Long documentId, String orgId);

    Optional<DocumentVersionEntity> findByDocumentIdAndVersionNumberAndOrgId(
            Long documentId, Integer versionNumber, String orgId);

    Optional<DocumentVersionEntity> findByDocumentIdAndIsCurrentTrueAndOrgId(
            Long documentId, String orgId);

    @Query(
            "SELECT MAX(v.versionNumber) FROM DocumentVersionEntity v WHERE v.documentId = :documentId AND v.orgId = :orgId")
    Integer findMaxVersionNumber(
            @Param("documentId") Long documentId, @Param("orgId") String orgId);
}
