package com.example.backend.repository;

import com.example.backend.entity.Dossier;
import com.example.backend.entity.enums.DossierStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface DossierRepository extends JpaRepository<Dossier, Long>, JpaSpecificationExecutor<Dossier> {
    
    @Query("SELECT DISTINCT d FROM Dossier d JOIN d.parties p WHERE p.phone = :phone AND d.status NOT IN :excludedStatuses")
    List<Dossier> findByPartiesPhoneAndStatusNotIn(@Param("phone") String phone, @Param("excludedStatuses") List<DossierStatus> excludedStatuses);
    
    Long countByStatusIn(List<DossierStatus> statuses);
}
