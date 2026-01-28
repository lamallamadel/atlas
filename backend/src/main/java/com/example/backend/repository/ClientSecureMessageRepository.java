package com.example.backend.repository;

import com.example.backend.entity.ClientSecureMessage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ClientSecureMessageRepository extends JpaRepository<ClientSecureMessage, Long> {
    List<ClientSecureMessage> findByOrgIdAndDossierIdOrderByCreatedAtAsc(String orgId, Long dossierId);
    long countByDossierIdAndFromClientAndReadAtIsNull(Long dossierId, Boolean fromClient);
}
