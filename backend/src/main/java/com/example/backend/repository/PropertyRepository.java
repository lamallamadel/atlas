package com.example.backend.repository;

import com.example.backend.entity.PropertyEntity;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PropertyRepository extends JpaRepository<PropertyEntity, Long> {

    List<PropertyEntity> findAllByOrderByCreatedAtDesc();
}
