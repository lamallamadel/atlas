package com.example.backend.repository;

import com.example.backend.entity.AgencyZoneEntity;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AgencyZoneRepository extends JpaRepository<AgencyZoneEntity, Long> {

    List<AgencyZoneEntity> findByOrgIdOrderByCityAscDistrictAsc(String orgId);

    List<AgencyZoneEntity> findByCityIgnoreCase(String city);
}
