package com.example.backend.repository;

import com.example.backend.entity.CommentThreadEntity;
import com.example.backend.entity.enums.CommentEntityType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CommentThreadRepository extends JpaRepository<CommentThreadEntity, Long> {

    List<CommentThreadEntity> findByEntityTypeAndEntityIdOrderByCreatedAtDesc(
            CommentEntityType entityType, Long entityId);

    List<CommentThreadEntity> findByEntityTypeAndEntityIdAndResolvedOrderByCreatedAtDesc(
            CommentEntityType entityType, Long entityId, Boolean resolved);

    @Query("SELECT COUNT(t) FROM CommentThreadEntity t WHERE t.entityType = :entityType " +
           "AND t.entityId = :entityId AND t.resolved = false")
    long countUnresolvedByEntity(@Param("entityType") CommentEntityType entityType,
                                  @Param("entityId") Long entityId);
}
