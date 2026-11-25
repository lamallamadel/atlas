package com.example.backend.repository;

import com.example.backend.entity.LeadConversationLinkEntity;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface LeadConversationLinkRepository
        extends JpaRepository<LeadConversationLinkEntity, Long> {

    Optional<LeadConversationLinkEntity> findByTokenHash(String tokenHash);
}
