package com.example.backend.repository;

import com.example.backend.entity.PartiePrenanteEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface PartiePrenanteRepository extends JpaRepository<PartiePrenanteEntity, Long> {
}
