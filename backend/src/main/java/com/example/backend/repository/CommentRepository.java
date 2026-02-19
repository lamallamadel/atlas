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

    @Query(
            value =
                    "SELECT c.* FROM comment c "
                            + "WHERE to_tsvector('french', c.content) @@ plainto_tsquery('french', :searchQuery) "
                            + "ORDER BY c.created_at DESC",
            nativeQuery = true)
    List<CommentEntity> searchByContent(@Param("searchQuery") String searchQuery);

    @Query("SELECT c FROM CommentEntity c WHERE c.createdBy = :username ORDER BY c.createdAt DESC")
    List<CommentEntity> findByCreatedBy(@Param("username") String username);

    @Query(
            "SELECT c FROM CommentEntity c WHERE :username MEMBER OF c.mentions ORDER BY c.createdAt DESC")
    List<CommentEntity> findByMention(@Param("username") String username);
}
