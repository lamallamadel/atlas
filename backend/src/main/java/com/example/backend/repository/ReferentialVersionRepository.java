package com.example.backend.repository;

import com.example.backend.entity.ReferentialVersionEntity;
import java.util.List;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ReferentialVersionRepository
        extends JpaRepository<ReferentialVersionEntity, Long> {

    List<ReferentialVersionEntity> findByReferentialIdOrderByCreatedAtDesc(Long referentialId);

    Page<ReferentialVersionEntity> findByReferentialIdOrderByCreatedAtDesc(
            Long referentialId, Pageable pageable);

    List<ReferentialVersionEntity> findByCategoryOrderByCreatedAtDesc(String category);

    Page<ReferentialVersionEntity> findByCategoryOrderByCreatedAtDesc(
            String category, Pageable pageable);
}
