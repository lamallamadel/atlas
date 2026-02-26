package com.example.backend.repository;

import com.example.backend.entity.AppointmentReminderMetricsEntity;
import java.time.LocalDateTime;
import java.util.List;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface AppointmentReminderMetricsRepository
        extends JpaRepository<AppointmentReminderMetricsEntity, Long> {

    Page<AppointmentReminderMetricsEntity> findByOrgIdAndSentAtBetween(
            String orgId, LocalDateTime startDate, LocalDateTime endDate, Pageable pageable);

    @Query(
            "SELECT m FROM AppointmentReminderMetricsEntity m "
                    + "WHERE m.orgId = :orgId "
                    + "AND (:channel IS NULL OR m.channel = :channel) "
                    + "AND (:templateCode IS NULL OR m.templateCode = :templateCode) "
                    + "AND (:agentId IS NULL OR m.agentId = :agentId) "
                    + "AND (:startDate IS NULL OR m.sentAt >= :startDate) "
                    + "AND (:endDate IS NULL OR m.sentAt <= :endDate) "
                    + "ORDER BY m.sentAt DESC")
    Page<AppointmentReminderMetricsEntity> findByFilters(
            @Param("orgId") String orgId,
            @Param("channel") String channel,
            @Param("templateCode") String templateCode,
            @Param("agentId") String agentId,
            @Param("startDate") LocalDateTime startDate,
            @Param("endDate") LocalDateTime endDate,
            Pageable pageable);

    @Query(
            "SELECT m.channel, COUNT(m), "
                    + "SUM(CASE WHEN m.status = 'DELIVERED' THEN 1 ELSE 0 END), "
                    + "SUM(CASE WHEN m.readAt IS NOT NULL THEN 1 ELSE 0 END), "
                    + "SUM(CASE WHEN m.noShowOccurred = true THEN 1 ELSE 0 END) "
                    + "FROM AppointmentReminderMetricsEntity m "
                    + "WHERE m.orgId = :orgId "
                    + "AND (:startDate IS NULL OR m.sentAt >= :startDate) "
                    + "AND (:endDate IS NULL OR m.sentAt <= :endDate) "
                    + "GROUP BY m.channel")
    List<Object[]> aggregateMetricsByChannel(
            @Param("orgId") String orgId,
            @Param("startDate") LocalDateTime startDate,
            @Param("endDate") LocalDateTime endDate);

    @Query(
            "SELECT m.templateCode, COUNT(m), "
                    + "SUM(CASE WHEN m.status = 'DELIVERED' THEN 1 ELSE 0 END), "
                    + "SUM(CASE WHEN m.readAt IS NOT NULL THEN 1 ELSE 0 END), "
                    + "SUM(CASE WHEN m.noShowOccurred = true THEN 1 ELSE 0 END) "
                    + "FROM AppointmentReminderMetricsEntity m "
                    + "WHERE m.orgId = :orgId "
                    + "AND m.templateCode IS NOT NULL "
                    + "AND (:startDate IS NULL OR m.sentAt >= :startDate) "
                    + "AND (:endDate IS NULL OR m.sentAt <= :endDate) "
                    + "GROUP BY m.templateCode")
    List<Object[]> aggregateMetricsByTemplate(
            @Param("orgId") String orgId,
            @Param("startDate") LocalDateTime startDate,
            @Param("endDate") LocalDateTime endDate);

    @Query(
            "SELECT m.agentId, COUNT(m), "
                    + "SUM(CASE WHEN m.status = 'DELIVERED' THEN 1 ELSE 0 END), "
                    + "SUM(CASE WHEN m.readAt IS NOT NULL THEN 1 ELSE 0 END), "
                    + "SUM(CASE WHEN m.noShowOccurred = true THEN 1 ELSE 0 END) "
                    + "FROM AppointmentReminderMetricsEntity m "
                    + "WHERE m.orgId = :orgId "
                    + "AND m.agentId IS NOT NULL "
                    + "AND (:startDate IS NULL OR m.sentAt >= :startDate) "
                    + "AND (:endDate IS NULL OR m.sentAt <= :endDate) "
                    + "GROUP BY m.agentId")
    List<Object[]> aggregateMetricsByAgent(
            @Param("orgId") String orgId,
            @Param("startDate") LocalDateTime startDate,
            @Param("endDate") LocalDateTime endDate);

    @Query(
            "SELECT FUNCTION('DATE', m.sentAt) as date, COUNT(m), "
                    + "SUM(CASE WHEN m.status = 'DELIVERED' THEN 1 ELSE 0 END), "
                    + "SUM(CASE WHEN m.readAt IS NOT NULL THEN 1 ELSE 0 END), "
                    + "SUM(CASE WHEN m.noShowOccurred = true THEN 1 ELSE 0 END) "
                    + "FROM AppointmentReminderMetricsEntity m "
                    + "WHERE m.orgId = :orgId "
                    + "AND (:startDate IS NULL OR m.sentAt >= :startDate) "
                    + "AND (:endDate IS NULL OR m.sentAt <= :endDate) "
                    + "GROUP BY FUNCTION('DATE', m.sentAt) "
                    + "ORDER BY date")
    List<Object[]> getTimeSeriesMetrics(
            @Param("orgId") String orgId,
            @Param("startDate") LocalDateTime startDate,
            @Param("endDate") LocalDateTime endDate);

    List<AppointmentReminderMetricsEntity> findByAppointmentId(Long appointmentId);

    @Query(
            "SELECT COUNT(m) FROM AppointmentReminderMetricsEntity m "
                    + "WHERE m.orgId = :orgId "
                    + "AND m.channel = :channel "
                    + "AND m.status = 'DELIVERED' "
                    + "AND m.sentAt BETWEEN :startDate AND :endDate")
    Long countDeliveredByChannel(
            @Param("orgId") String orgId,
            @Param("channel") String channel,
            @Param("startDate") LocalDateTime startDate,
            @Param("endDate") LocalDateTime endDate);

    @Query(
            "SELECT COUNT(m) FROM AppointmentReminderMetricsEntity m "
                    + "WHERE m.orgId = :orgId "
                    + "AND m.channel = :channel "
                    + "AND m.sentAt BETWEEN :startDate AND :endDate")
    Long countSentByChannel(
            @Param("orgId") String orgId,
            @Param("channel") String channel,
            @Param("startDate") LocalDateTime startDate,
            @Param("endDate") LocalDateTime endDate);

    @Query(
            "SELECT CAST(SUM(CASE WHEN m.readAt IS NOT NULL THEN 1 ELSE 0 END) AS double) / "
                    + "CAST(COUNT(m) AS double) "
                    + "FROM AppointmentReminderMetricsEntity m "
                    + "WHERE m.appointment.dossier.id = :dossierId "
                    + "AND m.sentAt < :beforeDate")
    Double calculateAverageResponseRateForDossier(
            @Param("dossierId") Long dossierId, @Param("beforeDate") LocalDateTime beforeDate);
}
