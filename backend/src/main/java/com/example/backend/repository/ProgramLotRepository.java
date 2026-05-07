package com.example.backend.repository;

import com.example.backend.entity.ProgramLot;
import com.example.backend.entity.enums.LotStatus;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

@Repository
public interface ProgramLotRepository
        extends JpaRepository<ProgramLot, Long>, JpaSpecificationExecutor<ProgramLot> {

    List<ProgramLot> findByProgramId(Long programId);
    
    List<ProgramLot> findByOrgIdAndStatus(String orgId, LotStatus status);
}
