package com.example.backend.repository;

import com.example.backend.entity.ConsentementEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ConsentementRepository extends JpaRepository<ConsentementEntity, Long> {
}
