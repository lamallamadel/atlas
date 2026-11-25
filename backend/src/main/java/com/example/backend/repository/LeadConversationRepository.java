package com.example.backend.repository;

import com.example.backend.entity.LeadConversationEntity;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface LeadConversationRepository extends JpaRepository<LeadConversationEntity, Long> {

    Optional<LeadConversationEntity> findByDossierId(Long dossierId);
}
