package com.example.backend.repository;

import com.example.backend.entity.SignatureRequestEntity;
import com.example.backend.entity.enums.SignatureStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface SignatureRequestRepository extends JpaRepository<SignatureRequestEntity, Long> {
    
    List<SignatureRequestEntity> findByDossierIdAndOrgId(Long dossierId, String orgId);
    
    Optional<SignatureRequestEntity> findByEnvelopeIdAndOrgId(String envelopeId, String orgId);
    
    Optional<SignatureRequestEntity> findByIdAndOrgId(Long id, String orgId);
    
    List<SignatureRequestEntity> findByOrgIdAndStatus(String orgId, SignatureStatus status);
    
    List<SignatureRequestEntity> findByOrgIdAndStatusIn(String orgId, List<SignatureStatus> statuses);
}
