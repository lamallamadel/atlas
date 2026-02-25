package com.example.backend.repository;

import com.example.backend.entity.AppointmentEntity;
import java.time.LocalDateTime;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface AppointmentRepository
                extends JpaRepository<AppointmentEntity, Long>,
                JpaSpecificationExecutor<AppointmentEntity> {

        @Query("SELECT a FROM AppointmentEntity a WHERE a.assignedTo = :assignedTo "
                        + "AND a.id != :excludeId "
                        + "AND ((a.startTime < :endTime AND a.endTime > :startTime))")
        List<AppointmentEntity> findOverlappingAppointments(
                        @Param("assignedTo") String assignedTo,
                        @Param("startTime") LocalDateTime startTime,
                        @Param("endTime") LocalDateTime endTime,
                        @Param("excludeId") Long excludeId);

        @Query("SELECT a FROM AppointmentEntity a WHERE a.status = :status "
                        + "AND a.reminderSent = false "
                        + "AND a.startTime BETWEEN :windowStart AND :windowEnd")
        List<AppointmentEntity> findAppointmentsForReminder(
                        @Param("status") com.example.backend.entity.enums.AppointmentStatus status,
                        @Param("windowStart") LocalDateTime windowStart,
                        @Param("windowEnd") LocalDateTime windowEnd);
}
