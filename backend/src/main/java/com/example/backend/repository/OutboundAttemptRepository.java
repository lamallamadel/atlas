package com.example.backend.repository;

import com.example.backend.entity.OutboundAttemptEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface OutboundAttemptRepository extends JpaRepository<OutboundAttemptEntity, Long> {
    
    List<OutboundAttemptEntity> findByOutboundMessageIdOrderByAttemptNoAsc(Long outboundMessageId);
}
