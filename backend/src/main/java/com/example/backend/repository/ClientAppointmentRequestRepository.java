package com.example.backend.repository;

import com.example.backend.entity.ClientAppointmentRequest;
import com.example.backend.entity.enums.AppointmentRequestStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ClientAppointmentRequestRepository extends JpaRepository<ClientAppointmentRequest, Long> {
    List<ClientAppointmentRequest> findByOrgIdAndDossierIdOrderByCreatedAtDesc(String orgId, Long dossierId);
    List<ClientAppointmentRequest> findByOrgIdAndStatusOrderByCreatedAtDesc(String orgId, AppointmentRequestStatus status);
}
