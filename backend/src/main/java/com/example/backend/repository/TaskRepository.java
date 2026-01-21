package com.example.backend.repository;

import com.example.backend.entity.TaskEntity;
import com.example.backend.entity.enums.TaskStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface TaskRepository extends JpaRepository<TaskEntity, Long>, JpaSpecificationExecutor<TaskEntity> {

    @Query("SELECT t FROM TaskEntity t WHERE t.assignedTo = :assignedTo " +
           "AND t.status IN ('TODO', 'IN_PROGRESS') " +
           "AND t.dueDate IS NOT NULL " +
           "AND t.dueDate < :currentDate " +
           "ORDER BY t.dueDate ASC")
    List<TaskEntity> findOverdueTasks(
            @Param("assignedTo") String assignedTo,
            @Param("currentDate") LocalDateTime currentDate
    );

    @Query("SELECT t FROM TaskEntity t WHERE t.orgId = :orgId " +
           "AND t.status IN ('TODO', 'IN_PROGRESS') " +
           "AND t.dueDate IS NOT NULL " +
           "AND t.dueDate < :currentDate " +
           "ORDER BY t.dueDate ASC")
    List<TaskEntity> findAllOverdueTasksForOrg(
            @Param("orgId") String orgId,
            @Param("currentDate") LocalDateTime currentDate
    );
}
