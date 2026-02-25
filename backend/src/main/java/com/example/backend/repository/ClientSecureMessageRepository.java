package com.example.backend.repository;

import com.example.backend.entity.ClientSecureMessage;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ClientSecureMessageRepository extends JpaRepository<ClientSecureMessage, Long> {
    List<ClientSecureMessage> findByOrgIdAndDossierIdOrderByCreatedAtAsc(
            String orgId, Long dossierId);

    long countByDossierIdAndFromClientAndReadAtIsNull(Long dossierId, Boolean fromClient);
}
