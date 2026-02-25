package com.example.backend.repository;

import com.example.backend.entity.WhatsAppTemplateVersion;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface WhatsAppTemplateVersionRepository
        extends JpaRepository<WhatsAppTemplateVersion, Long> {

    List<WhatsAppTemplateVersion> findByTemplateIdOrderByVersionNumberDesc(Long templateId);

    Optional<WhatsAppTemplateVersion> findByTemplateIdAndVersionNumber(
            Long templateId, Integer versionNumber);

    @Query(
            "SELECT v FROM WhatsAppTemplateVersion v WHERE v.template.id = :templateId AND v.isActive = true")
    Optional<WhatsAppTemplateVersion> findActiveVersionByTemplateId(
            @Param("templateId") Long templateId);

    @Query(
            "SELECT MAX(v.versionNumber) FROM WhatsAppTemplateVersion v WHERE v.template.id = :templateId")
    Integer findMaxVersionNumberByTemplateId(@Param("templateId") Long templateId);
}
