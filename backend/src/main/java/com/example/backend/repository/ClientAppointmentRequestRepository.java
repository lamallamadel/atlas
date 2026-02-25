package com.example.backend.repository;

import com.example.backend.entity.ClientAppointmentRequest;
import com.example.backend.entity.enums.AppointmentRequestStatus;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ClientAppointmentRequestRepository
        extends JpaRepository<ClientAppointmentRequest, Long> {
    List<ClientAppointmentRequest> findByOrgIdAndDossierIdOrderByCreatedAtDesc(
            String orgId, Long dossierId);

    List<ClientAppointmentRequest> findByOrgIdAndStatusOrderByCreatedAtDesc(
            String orgId, AppointmentRequestStatus status);
}
