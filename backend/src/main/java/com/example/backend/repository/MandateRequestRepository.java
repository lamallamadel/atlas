package com.example.backend.repository;

import com.example.backend.entity.MandateRequestEntity;
import java.time.LocalDateTime;
import java.util.Collection;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface MandateRequestRepository extends JpaRepository<MandateRequestEntity, Long> {

    List<MandateRequestEntity> findByOwnerOrgIdOrderByCreatedAtDesc(String ownerOrgId);

    List<MandateRequestEntity> findByPropertyIdOrderByCreatedAtDesc(Long propertyId);

    List<MandateRequestEntity> findByStatusAndVisibilityOrderByOpenedAtDesc(
            String status, String visibility);

    List<MandateRequestEntity> findByTargetAgencyOrgIdOrderByCreatedAtDesc(String agencyOrgId);

    List<MandateRequestEntity> findByStatusInAndExpiresAtBefore(
            Collection<String> statuses, LocalDateTime before);
}
