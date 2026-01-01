package com.example.backend.service;

import com.example.backend.dto.AnnonceCreateRequest;
import com.example.backend.dto.AnnonceMapper;
import com.example.backend.dto.AnnonceResponse;
import com.example.backend.dto.AnnonceUpdateRequest;
import com.example.backend.entity.Annonce;
import com.example.backend.entity.enums.AnnonceStatus;
import com.example.backend.repository.AnnonceRepository;
import jakarta.persistence.EntityNotFoundException;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AnnonceService {

    private final AnnonceRepository annonceRepository;
    private final AnnonceMapper annonceMapper;

    public AnnonceService(AnnonceRepository annonceRepository, AnnonceMapper annonceMapper) {
        this.annonceRepository = annonceRepository;
        this.annonceMapper = annonceMapper;
    }

    @Transactional
    public AnnonceResponse create(AnnonceCreateRequest request) {
        Annonce annonce = annonceMapper.toEntity(request);
        Annonce saved = annonceRepository.save(annonce);
        return annonceMapper.toResponse(saved);
    }

    @Transactional(readOnly = true)
    public AnnonceResponse getById(Long id) {
        Annonce annonce = annonceRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Annonce not found with id: " + id));
        return annonceMapper.toResponse(annonce);
    }

    @Transactional
    public AnnonceResponse update(Long id, AnnonceUpdateRequest request) {
        Annonce annonce = annonceRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Annonce not found with id: " + id));
        annonceMapper.updateEntity(annonce, request);
        Annonce updated = annonceRepository.save(annonce);
        return annonceMapper.toResponse(updated);
    }

    @Transactional(readOnly = true)
    public Page<AnnonceResponse> list(AnnonceStatus status, String q, Pageable pageable) {
        Specification<Annonce> spec = Specification.where(null);

        if (status != null) {
            spec = spec.and((root, query, criteriaBuilder) ->
                    criteriaBuilder.equal(root.get("status"), status));
        }

        if (q != null && !q.trim().isEmpty()) {
            String searchPattern = "%" + q.toLowerCase() + "%";
            spec = spec.and((root, query, criteriaBuilder) ->
                    criteriaBuilder.or(
                            criteriaBuilder.like(criteriaBuilder.lower(root.get("title")), searchPattern),
                            criteriaBuilder.like(criteriaBuilder.lower(root.get("description")), searchPattern),
                            criteriaBuilder.like(criteriaBuilder.lower(root.get("category")), searchPattern),
                            criteriaBuilder.like(criteriaBuilder.lower(root.get("city")), searchPattern)
                    ));
        }

        Page<Annonce> annonces = annonceRepository.findAll(spec, pageable);
        return annonces.map(annonceMapper::toResponse);
    }
}
