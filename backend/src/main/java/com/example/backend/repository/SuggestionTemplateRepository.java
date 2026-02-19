package com.example.backend.repository;

import com.example.backend.entity.SuggestionTemplate;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface SuggestionTemplateRepository extends JpaRepository<SuggestionTemplate, Long> {

    @Query(
            "SELECT st FROM SuggestionTemplate st WHERE st.isActive = true "
                    + "AND (st.orgId = :orgId OR st.orgId = 'default') "
                    + "AND st.triggerCondition = :trigger ORDER BY st.priority DESC")
    List<SuggestionTemplate> findActiveByTrigger(
            @Param("orgId") String orgId, @Param("trigger") String trigger);

    List<SuggestionTemplate> findByOrgIdAndIsActiveTrue(String orgId);

    @Query(
            "SELECT st FROM SuggestionTemplate st WHERE st.isActive = true "
                    + "AND (st.orgId = :orgId OR st.orgId = 'default') "
                    + "ORDER BY st.priority DESC")
    List<SuggestionTemplate> findAllActiveTemplates(@Param("orgId") String orgId);
}
