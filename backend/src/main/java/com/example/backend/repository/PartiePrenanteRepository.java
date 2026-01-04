package com.example.backend.repository;

import com.example.backend.entity.PartiePrenanteEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PartiePrenanteRepository extends JpaRepository<PartiePrenanteEntity, Long> {
    List<PartiePrenanteEntity> findByDossierId(Long dossierId);
}
