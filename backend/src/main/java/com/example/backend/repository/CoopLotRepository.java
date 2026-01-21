package com.example.backend.repository;

import com.example.backend.entity.CoopLot;
import com.example.backend.entity.enums.LotStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface CoopLotRepository extends JpaRepository<CoopLot, Long>, JpaSpecificationExecutor<CoopLot> {

    Optional<CoopLot> findByIdAndOrgId(Long id, String orgId);

    Page<CoopLot> findByProjectIdAndOrgId(Long projectId, String orgId, Pageable pageable);

    Page<CoopLot> findByStatusAndOrgId(LotStatus status, String orgId, Pageable pageable);

    Page<CoopLot> findByMemberIdAndOrgId(Long memberId, String orgId, Pageable pageable);
}
