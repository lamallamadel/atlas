package com.example.backend.repository;

import com.example.backend.entity.CoopGroup;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

@Repository
public interface CoopGroupRepository
        extends JpaRepository<CoopGroup, Long>, JpaSpecificationExecutor<CoopGroup> {

    Optional<CoopGroup> findByIdAndOrgId(Long id, String orgId);
}
