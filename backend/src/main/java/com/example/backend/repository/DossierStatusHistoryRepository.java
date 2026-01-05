package com.example.backend.repository;

import com.example.backend.entity.DossierStatusHistory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface DossierStatusHistoryRepository extends JpaRepository<DossierStatusHistory, Long> {
    Page<DossierStatusHistory> findByDossierId(Long dossierId, Pageable pageable);
}
