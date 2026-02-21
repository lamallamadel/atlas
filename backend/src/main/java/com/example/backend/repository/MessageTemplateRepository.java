package com.example.backend.repository;

import com.example.backend.entity.MessageTemplate;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface MessageTemplateRepository extends JpaRepository<MessageTemplate, Long> {

    @Query(
            "SELECT mt FROM MessageTemplate mt WHERE mt.isActive = true "
                    + "AND (mt.orgId = :orgId OR mt.orgId = 'default') "
                    + "AND mt.category = :category ORDER BY mt.usageCount DESC")
    List<MessageTemplate> findByCategoryOrderByUsage(
            @Param("orgId") String orgId, @Param("category") String category);

    @Query(
            "SELECT mt FROM MessageTemplate mt WHERE mt.isActive = true "
                    + "AND (mt.orgId = :orgId OR mt.orgId = 'default') "
                    + "ORDER BY mt.usageCount DESC")
    List<MessageTemplate> findAllActiveTemplates(@Param("orgId") String orgId);

    @Query(
            "SELECT mt FROM MessageTemplate mt WHERE mt.isActive = true "
                    + "AND (mt.orgId = :orgId OR mt.orgId = 'default') "
                    + "AND mt.channel = :channel ORDER BY mt.usageCount DESC")
    List<MessageTemplate> findByChannelOrderByUsage(
            @Param("orgId") String orgId, @Param("channel") String channel);
}
