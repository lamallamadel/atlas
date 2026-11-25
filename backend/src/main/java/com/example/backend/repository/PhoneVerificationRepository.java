package com.example.backend.repository;

import com.example.backend.entity.PhoneVerificationEntity;
import java.time.LocalDateTime;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PhoneVerificationRepository extends JpaRepository<PhoneVerificationEntity, Long> {

    long countByPhoneAndPurposeAndCreatedAtAfter(String phone, String purpose, LocalDateTime after);

    long countByIpAddressAndCreatedAtAfter(String ipAddress, LocalDateTime after);

    Optional<PhoneVerificationEntity>
            findFirstByPhoneAndPurposeAndConsumedAtIsNullOrderByCreatedAtDesc(
                    String phone, String purpose);
}
