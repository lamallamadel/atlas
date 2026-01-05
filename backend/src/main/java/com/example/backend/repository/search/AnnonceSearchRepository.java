package com.example.backend.repository.search;

import com.example.backend.entity.search.AnnonceDocument;
import org.springframework.data.elasticsearch.repository.ElasticsearchRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AnnonceSearchRepository extends ElasticsearchRepository<AnnonceDocument, Long> {
    List<AnnonceDocument> findByOrgId(String orgId);
}
