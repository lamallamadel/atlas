package com.example.backend.repository;

import com.example.backend.entity.WhatsAppTemplate;
import com.example.backend.entity.enums.TemplateStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface WhatsAppTemplateRepository extends JpaRepository<WhatsAppTemplate, Long> {

    List<WhatsAppTemplate> findByStatusOrderByNameAsc(TemplateStatus status);

    List<WhatsAppTemplate> findByStatusInOrderByNameAsc(List<TemplateStatus> statuses);

    Optional<WhatsAppTemplate> findByNameAndLanguage(String name, String language);

    boolean existsByNameAndLanguage(String name, String language);

    @Query("SELECT t FROM WhatsAppTemplate t WHERE t.orgId = :orgId ORDER BY t.createdAt DESC")
    List<WhatsAppTemplate> findAllByOrgId(@Param("orgId") String orgId);

    @Query("SELECT t FROM WhatsAppTemplate t WHERE t.orgId = :orgId AND t.status = :status ORDER BY t.name ASC")
    List<WhatsAppTemplate> findByOrgIdAndStatus(@Param("orgId") String orgId, @Param("status") TemplateStatus status);

    List<WhatsAppTemplate> findByLanguageOrderByNameAsc(String language);
}
