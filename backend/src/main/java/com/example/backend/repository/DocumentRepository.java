package com.example.backend.repository;

import com.example.backend.entity.DocumentEntity;
import java.util.List;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface DocumentRepository extends JpaRepository<DocumentEntity, Long> {

    @Query("SELECT d FROM DocumentEntity d WHERE d.dossierId = :dossierId")
    Page<DocumentEntity> findByDossierId(@Param("dossierId") Long dossierId, Pageable pageable);

    @Query("SELECT d FROM DocumentEntity d WHERE d.dossierId = :dossierId")
    List<DocumentEntity> findByDossierId(@Param("dossierId") Long dossierId);

    @Query(
            "SELECT d FROM DocumentEntity d WHERE d.dossierId = :dossierId AND d.fileType = :fileType")
    List<DocumentEntity> findByDossierIdAndFileType(
            @Param("dossierId") Long dossierId, @Param("fileType") String fileType);

    @Query("SELECT d FROM DocumentEntity d WHERE d.id = :id AND d.orgId = :orgId")
    java.util.Optional<DocumentEntity> findByIdAndOrgId(
            @Param("id") Long id, @Param("orgId") String orgId);
}
