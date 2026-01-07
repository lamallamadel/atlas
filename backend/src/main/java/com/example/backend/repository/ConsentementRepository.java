package com.example.backend.repository;

import com.example.backend.entity.ConsentementEntity;
import com.example.backend.entity.enums.ConsentementChannel;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ConsentementRepository extends JpaRepository<ConsentementEntity, Long> {
    
    List<ConsentementEntity> findByDossierId(Long dossierId);
    
    List<ConsentementEntity> findByDossierIdOrderByUpdatedAtDesc(Long dossierId);
    
    List<ConsentementEntity> findByDossierIdAndChannelOrderByUpdatedAtDesc(Long dossierId, ConsentementChannel channel);
    
    Page<ConsentementEntity> findByDossierId(Long dossierId, Pageable pageable);
    
    Page<ConsentementEntity> findByDossierIdAndChannel(Long dossierId, ConsentementChannel channel, Pageable pageable);
}
