package com.example.backend.repository;

import com.example.backend.entity.ClientSatisfactionSurvey;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ClientSatisfactionSurveyRepository
        extends JpaRepository<ClientSatisfactionSurvey, Long> {
    List<ClientSatisfactionSurvey> findByOrgIdAndDossierIdOrderByCreatedAtDesc(
            String orgId, Long dossierId);

    Optional<ClientSatisfactionSurvey>
            findByOrgIdAndTriggerTypeAndTriggerEntityIdAndCompletedAtIsNull(
                    String orgId, String triggerType, Long triggerEntityId);
}
