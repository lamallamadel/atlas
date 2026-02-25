package com.example.backend.repository;

import com.example.backend.entity.ClientAuthToken;
import java.time.LocalDateTime;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ClientAuthTokenRepository extends JpaRepository<ClientAuthToken, Long> {
    Optional<ClientAuthToken> findByTokenAndExpiresAtAfter(String token, LocalDateTime now);

    void deleteByExpiresAtBefore(LocalDateTime now);
}
