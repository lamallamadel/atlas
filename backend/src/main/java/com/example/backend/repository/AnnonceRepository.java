package com.example.backend.repository;

import com.example.backend.entity.Annonce;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AnnonceRepository extends JpaRepository<Annonce, Long> {
    List<Annonce> findTop10ByOrgIdOrderByCreatedAtDesc(String orgId);
}
