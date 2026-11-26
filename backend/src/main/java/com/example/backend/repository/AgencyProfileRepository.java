package com.example.backend.repository;

import com.example.backend.entity.AgencyProfileEntity;
import java.util.Collection;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AgencyProfileRepository extends JpaRepository<AgencyProfileEntity, Long> {

    Optional<AgencyProfileEntity> findByOrgId(String orgId);

    List<AgencyProfileEntity> findByOrgIdIn(Collection<String> orgIds);
}
