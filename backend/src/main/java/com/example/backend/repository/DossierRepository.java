package com.example.backend.repository;

import com.example.backend.entity.Dossier;
import com.example.backend.entity.enums.DossierStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;

@Repository
public interface DossierRepository extends JpaRepository<Dossier, Long>, JpaSpecificationExecutor<Dossier> {

    @Query("SELECT DISTINCT d FROM Dossier d JOIN d.parties p WHERE p.phone = :phone AND d.status NOT IN :excludedStatuses")
    List<Dossier> findByPartiesPhoneAndStatusNotIn(@Param("phone") String phone,
            @Param("excludedStatuses") List<DossierStatus> excludedStatuses);

    @Query("SELECT DISTINCT d FROM Dossier d WHERE d.leadPhone = :phone AND d.status NOT IN :excludedStatuses")
    List<Dossier> findByLeadPhoneAndStatusNotIn(@Param("phone") String phone,
            @Param("excludedStatuses") List<DossierStatus> excludedStatuses);

    @Query("SELECT DISTINCT d FROM Dossier d WHERE d.leadPhone = :phone AND d.orgId = :orgId AND d.status NOT IN :excludedStatuses")
    List<Dossier> findByLeadPhoneAndOrgIdAndStatusNotIn(@Param("phone") String phone, @Param("orgId") String orgId,
            @Param("excludedStatuses") List<DossierStatus> excludedStatuses);

    Long countByStatusIn(List<DossierStatus> statuses);

    @Query("SELECT COUNT(d) FROM Dossier d WHERE d.status = :status AND d.createdAt >= :startDate")
    Long countByStatusAndCreatedAtAfter(@Param("status") DossierStatus status,
            @Param("startDate") LocalDateTime startDate);

    @Query("SELECT COUNT(d) FROM Dossier d WHERE d.status = :status AND d.orgId = :orgId AND d.createdAt >= :startDate")
    Long countByStatusAndCreatedAtAfter(@Param("status") DossierStatus status, @Param("orgId") String orgId,
            @Param("startDate") LocalDateTime startDate);

    @Query("SELECT COUNT(d) FROM Dossier d WHERE d.status = :status AND d.createdAt >= :startDate AND d.createdAt < :endDate")
    Long countByStatusAndCreatedAtBetween(@Param("status") DossierStatus status,
            @Param("startDate") LocalDateTime startDate, @Param("endDate") LocalDateTime endDate);

    @Query("SELECT COUNT(d) FROM Dossier d WHERE d.status IN :statuses AND d.createdAt >= :startDate")
    Long countByStatusInAndCreatedAtAfter(@Param("statuses") List<DossierStatus> statuses,
            @Param("startDate") LocalDateTime startDate);

    @Query("SELECT COUNT(d) FROM Dossier d WHERE d.status IN :statuses AND d.orgId = :orgId AND d.createdAt >= :startDate")
    Long countByStatusInAndCreatedAtAfter(@Param("statuses") List<DossierStatus> statuses, @Param("orgId") String orgId,
            @Param("startDate") LocalDateTime startDate);

    @Query("SELECT COUNT(d) FROM Dossier d WHERE d.status IN :statuses AND d.createdAt >= :startDate AND d.createdAt < :endDate")
    Long countByStatusInAndCreatedAtBetween(@Param("statuses") List<DossierStatus> statuses,
            @Param("startDate") LocalDateTime startDate, @Param("endDate") LocalDateTime endDate);

    @Query("SELECT COUNT(d) FROM Dossier d WHERE d.status IN :statuses AND d.orgId = :orgId AND d.createdAt >= :startDate AND d.createdAt < :endDate")
    Long countByStatusInAndCreatedAtBetween(@Param("statuses") List<DossierStatus> statuses,
            @Param("orgId") String orgId, @Param("startDate") LocalDateTime startDate,
            @Param("endDate") LocalDateTime endDate);

    @Query("SELECT COUNT(d) FROM Dossier d WHERE d.status IN :statuses AND d.orgId = :orgId")
    Long countByStatusInAndOrgId(@Param("statuses") List<DossierStatus> statuses, @Param("orgId") String orgId);

    default Long getPendingCount() {
        return countByStatusIn(Arrays.asList(DossierStatus.NEW, DossierStatus.QUALIFIED));
    }

    default Long getPendingCountByOrgId(String orgId) {
        return countByStatusInAndOrgId(Arrays.asList(DossierStatus.NEW, DossierStatus.QUALIFIED), orgId);
    }
}
