package com.example.backend.repository.search;

import com.example.backend.entity.search.DossierDocument;
import java.util.List;
import org.springframework.data.elasticsearch.repository.ElasticsearchRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface DossierSearchRepository extends ElasticsearchRepository<DossierDocument, Long> {
    List<DossierDocument> findByOrgId(String orgId);
}
