package com.example.backend.repository;

import com.example.backend.entity.Annonce;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface AnnonceRepository extends JpaRepository<Annonce, UUID>, JpaSpecificationExecutor<Annonce> {
}
