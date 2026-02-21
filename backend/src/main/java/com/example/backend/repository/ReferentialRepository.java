package com.example.backend.repository;

import com.example.backend.entity.ReferentialEntity;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ReferentialRepository extends JpaRepository<ReferentialEntity, Long> {

    List<ReferentialEntity> findByCategoryOrderByDisplayOrderAsc(String category);

    List<ReferentialEntity> findByCategoryAndIsActiveTrueOrderByDisplayOrderAsc(String category);

    Optional<ReferentialEntity> findByCategoryAndCode(String category, String code);

    Optional<ReferentialEntity> findByOrgIdAndCategoryAndCode(
            String orgId, String category, String code);

    boolean existsByCategoryAndCode(String category, String code);
}
