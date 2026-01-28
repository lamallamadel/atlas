package com.example.backend.repository;

import com.example.backend.entity.ConsentementEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ConsentementRepository extends JpaRepository<ConsentementEntity, Long> {
    List<ConsentementEntity> findByDossierId(Long dossierId);
}
