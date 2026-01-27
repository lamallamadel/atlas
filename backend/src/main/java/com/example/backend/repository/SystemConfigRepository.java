package com.example.backend.repository;

import com.example.backend.entity.SystemConfig;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface SystemConfigRepository extends JpaRepository<SystemConfig, Long> {

    Optional<SystemConfig> findByKey(String key);

    List<SystemConfig> findByCategory(String category);

    boolean existsByKey(String key);

    void deleteByKey(String key);
}
