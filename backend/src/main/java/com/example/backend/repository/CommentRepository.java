package com.example.backend.repository;

import com.example.backend.entity.CommentEntity;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface CommentRepository extends JpaRepository<CommentEntity, Long> {

    List<CommentEntity> findByThreadIdOrderByCreatedAtAsc(Long threadId);

    /**
     * SQL natif : ni le filtre d'agence ni celui du périmètre « mes dossiers » ne s'appliquent,
     * d'où les conditions explicites. {@code dsUserId} vaut {@code null} hors périmètre.
     */
    @Query(
            value =
                    "SELECT c.* FROM comment c JOIN comment_thread t ON t.id = c.thread_id "
                            + "WHERE c.org_id = :orgId "
                            + "AND to_tsvector('french', c.content) @@ plainto_tsquery('french', :searchQuery) "
                            + SCOPE
                            + "ORDER BY c.created_at DESC",
            nativeQuery = true)
    List<CommentEntity> searchByContent(
            @Param("searchQuery") String searchQuery,
            @Param("orgId") String orgId,
            @Param("dsUserId") String dsUserId);

    @Query("SELECT c FROM CommentEntity c WHERE c.createdBy = :username ORDER BY c.createdAt DESC")
    List<CommentEntity> findByCreatedBy(@Param("username") String username);

    @Query(
            value =
                    "SELECT c.* FROM comment c JOIN comment_thread t ON t.id = c.thread_id "
                            + "WHERE c.org_id = :orgId "
                            + "AND c.mentions_json @> jsonb_build_array(CAST(:username AS text)) "
                            + SCOPE
                            + "ORDER BY c.created_at DESC",
            nativeQuery = true)
    List<CommentEntity> findByMention(
            @Param("username") String username,
            @Param("orgId") String orgId,
            @Param("dsUserId") String dsUserId);

    /** Fils hors dossier, ou dossier visible de l'agent restreint (aucune limite si null). */
    String SCOPE =
            "AND (CAST(:dsUserId AS varchar) IS NULL OR t.entity_type <> 'DOSSIER' OR t.entity_id IN "
                    + "(SELECT d.id FROM dossier d WHERE d.assigned_to = CAST(:dsUserId AS varchar) "
                    + "OR d.assigned_to IS NULL)) ";
}
