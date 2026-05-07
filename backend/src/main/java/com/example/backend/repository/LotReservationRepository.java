package com.example.backend.repository;

import com.example.backend.entity.LotReservation;
import com.example.backend.entity.enums.ReservationStatus;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

@Repository
public interface LotReservationRepository
        extends JpaRepository<LotReservation, Long>, JpaSpecificationExecutor<LotReservation> {

    List<LotReservation> findByLotId(Long lotId);
    
    List<LotReservation> findByDossierId(Long dossierId);
    
    List<LotReservation> findByOrgIdAndStatus(String orgId, ReservationStatus status);
}
