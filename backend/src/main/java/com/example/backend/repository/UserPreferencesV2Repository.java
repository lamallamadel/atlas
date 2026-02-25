package com.example.backend.repository;

import com.example.backend.entity.UserPreferences;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface UserPreferencesV2Repository extends JpaRepository<UserPreferences, Long> {

    Optional<UserPreferences> findByUserId(String userId);

    boolean existsByUserId(String userId);

    void deleteByUserId(String userId);
}
