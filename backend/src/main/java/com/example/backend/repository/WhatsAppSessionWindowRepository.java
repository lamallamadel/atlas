package com.example.backend.repository;

import com.example.backend.entity.WhatsAppSessionWindow;
import java.time.LocalDateTime;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface WhatsAppSessionWindowRepository
        extends JpaRepository<WhatsAppSessionWindow, Long> {

    @Query(
            "SELECT s FROM WhatsAppSessionWindow s WHERE s.orgId = :orgId AND s.phoneNumber = :phoneNumber")
    Optional<WhatsAppSessionWindow> findByOrgIdAndPhoneNumber(
            @Param("orgId") String orgId, @Param("phoneNumber") String phoneNumber);

    @Modifying
    @Query("DELETE FROM WhatsAppSessionWindow s WHERE s.windowExpiresAt < :expiryTime")
    void deleteExpiredSessions(@Param("expiryTime") LocalDateTime expiryTime);

    @Query(
            "SELECT s FROM WhatsAppSessionWindow s WHERE s.windowExpiresAt > :currentTime ORDER BY s.windowExpiresAt ASC")
    java.util.List<WhatsAppSessionWindow> findActiveWindows(
            @Param("currentTime") LocalDateTime currentTime);
}
