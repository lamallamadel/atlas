package com.example.backend.repository;

import com.example.backend.entity.RealEstateProgram;
import com.example.backend.entity.enums.ProgramStatus;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

@Repository
public interface RealEstateProgramRepository
        extends JpaRepository<RealEstateProgram, Long>, JpaSpecificationExecutor<RealEstateProgram> {

    List<RealEstateProgram> findByOrgId(String orgId);
    
    List<RealEstateProgram> findByOrgIdAndStatus(String orgId, ProgramStatus status);
}
