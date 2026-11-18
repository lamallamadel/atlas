package com.example.backend.repository;

import com.example.backend.entity.AnnonceMedia;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AnnonceMediaRepository extends JpaRepository<AnnonceMedia, Long> {

    List<AnnonceMedia> findByAnnonceIdOrderByPositionAscIdAsc(Long annonceId);

    long countByAnnonceId(Long annonceId);
}
