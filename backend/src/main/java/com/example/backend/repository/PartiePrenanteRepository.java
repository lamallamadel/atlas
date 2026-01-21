package com.example.backend.repository;

import com.example.backend.entity.PartiePrenanteEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PartiePrenanteRepository extends JpaRepository<PartiePrenanteEntity, Long> {
    List<PartiePrenanteEntity> findByDossierId(Long dossierId);
    
    @Query("SELECT p FROM PartiePrenanteEntity p WHERE LOWER(p.email) = LOWER(:email) AND p.orgId = :orgId")
    List<PartiePrenanteEntity> findByEmailAndOrgId(@Param("email") String email, @Param("orgId") String orgId);
}
