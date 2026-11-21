package com.example.backend.repository;

import com.example.backend.entity.ConsentRequest;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ConsentRequestRepository extends JpaRepository<ConsentRequest, Long> {

    Optional<ConsentRequest> findByTokenHash(String tokenHash);
}
