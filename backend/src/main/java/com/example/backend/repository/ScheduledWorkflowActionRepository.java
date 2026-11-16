package com.example.backend.repository;

import com.example.backend.entity.ScheduledWorkflowAction;
import java.time.LocalDateTime;
import java.util.List;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ScheduledWorkflowActionRepository extends JpaRepository<ScheduledWorkflowAction, Long> {

    List<ScheduledWorkflowAction> findByRunAtBefore(LocalDateTime time, Pageable pageable);
}
