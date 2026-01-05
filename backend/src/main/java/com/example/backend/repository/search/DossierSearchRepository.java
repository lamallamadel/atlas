package com.example.backend.repository.search;

import com.example.backend.entity.search.DossierDocument;
import org.springframework.data.elasticsearch.repository.ElasticsearchRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface DossierSearchRepository extends ElasticsearchRepository<DossierDocument, Long> {
    List<DossierDocument> findByOrgId(String orgId);
}
