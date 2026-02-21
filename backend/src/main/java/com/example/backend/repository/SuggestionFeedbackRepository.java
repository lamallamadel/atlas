package com.example.backend.repository;

import com.example.backend.entity.SuggestionFeedback;
import java.time.LocalDateTime;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface SuggestionFeedbackRepository extends JpaRepository<SuggestionFeedback, Long> {

    @Query(
            "SELECT COUNT(sf) FROM SuggestionFeedback sf WHERE sf.orgId = :orgId "
                    + "AND sf.suggestionType = :suggestionType AND sf.wasAccepted = true")
    Long countAcceptedBySuggestionType(
            @Param("orgId") String orgId, @Param("suggestionType") String suggestionType);

    @Query(
            "SELECT COUNT(sf) FROM SuggestionFeedback sf WHERE sf.orgId = :orgId "
                    + "AND sf.suggestionType = :suggestionType")
    Long countTotalBySuggestionType(
            @Param("orgId") String orgId, @Param("suggestionType") String suggestionType);

    @Query(
            "SELECT CAST(COUNT(sf) AS double) FROM SuggestionFeedback sf WHERE sf.orgId = :orgId "
                    + "AND sf.suggestionType = :suggestionType AND sf.wasAccepted = true "
                    + "AND sf.createdAt >= :since")
    Long countAcceptedSince(
            @Param("orgId") String orgId,
            @Param("suggestionType") String suggestionType,
            @Param("since") LocalDateTime since);
}
