package com.example.backend.repository;

import com.example.backend.entity.UserPreferences;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface UserPreferencesV2Repository extends JpaRepository<UserPreferences, Long> {

    Optional<UserPreferences> findByUserId(String userId);

    boolean existsByUserId(String userId);

    void deleteByUserId(String userId);
}
