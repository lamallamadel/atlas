package com.example.backend.service;

import com.example.backend.dto.SearchResponseDto;
import com.example.backend.dto.SearchResultDto;
import com.example.backend.entity.Annonce;
import com.example.backend.entity.Dossier;
import com.example.backend.entity.search.AnnonceDocument;
import com.example.backend.entity.search.DossierDocument;
import com.example.backend.repository.AnnonceRepository;
import com.example.backend.repository.DossierRepository;
import com.example.backend.repository.search.AnnonceSearchRepository;
import com.example.backend.repository.search.DossierSearchRepository;
import com.example.backend.util.TenantContext;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.elasticsearch.core.ElasticsearchOperations;
import org.springframework.data.elasticsearch.core.SearchHit;
import org.springframework.data.elasticsearch.core.SearchHits;
import org.springframework.data.elasticsearch.core.query.Criteria;
import org.springframework.data.elasticsearch.core.query.CriteriaQuery;
import org.springframework.data.elasticsearch.core.query.Query;
import org.springframework.stereotype.Service;

import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import java.util.*;
import java.util.stream.Collectors;

@Service
@ConditionalOnProperty(name = "elasticsearch.enabled", havingValue = "true", matchIfMissing = false)
public class SearchService {

    private static final Logger logger = LoggerFactory.getLogger(SearchService.class);

    @Autowired(required = false)
    private ElasticsearchOperations elasticsearchOperations;

    @Autowired(required = false)
    private AnnonceSearchRepository annonceSearchRepository;

    @Autowired(required = false)
    private DossierSearchRepository dossierSearchRepository;

    @Autowired
    private AnnonceRepository annonceRepository;

    @Autowired
    private DossierRepository dossierRepository;

    @PersistenceContext
    private EntityManager entityManager;

    private final ObjectMapper objectMapper = new ObjectMapper();

    public SearchResponseDto search(String query, String type, Map<String, Object> filters, int page, int size) {
        String orgId = TenantContext.getOrgId();

        if (isElasticsearchAvailable()) {
            try {
                return searchWithElasticsearch(query, type, filters, orgId, page, size);
            } catch (Exception e) {
                logger.warn("Elasticsearch search failed, falling back to PostgreSQL: {}", e.getMessage());
                return searchWithPostgreSQL(query, type, filters, orgId, page, size);
            }
        } else {
            logger.info("Elasticsearch not available, using PostgreSQL full-text search");
            return searchWithPostgreSQL(query, type, filters, orgId, page, size);
        }
    }

    private SearchResponseDto searchWithElasticsearch(String query, String type, Map<String, Object> filters, String orgId, int page, int size) {
        List<SearchResultDto> results = new ArrayList<>();
        long totalHits = 0;

        if (type == null || type.equalsIgnoreCase("annonce")) {
            SearchHits<AnnonceDocument> annonceHits = searchAnnonces(query, filters, orgId, page, size);
            results.addAll(convertAnnonceHits(annonceHits));
            totalHits += annonceHits.getTotalHits();
        }

        if (type == null || type.equalsIgnoreCase("dossier")) {
            SearchHits<DossierDocument> dossierHits = searchDossiers(query, filters, orgId, page, size);
            results.addAll(convertDossierHits(dossierHits));
            totalHits += dossierHits.getTotalHits();
        }

        results.sort((a, b) -> Double.compare(b.getRelevanceScore(), a.getRelevanceScore()));
        if (results.size() > size) {
            results = results.subList(0, size);
        }

        return new SearchResponseDto(results, totalHits, true);
    }

    private SearchHits<AnnonceDocument> searchAnnonces(String query, Map<String, Object> filters, String orgId, int page, int size) {
        Criteria criteria = new Criteria("orgId").is(orgId);

        if (query != null && !query.isBlank()) {
            Criteria queryCriteria = new Criteria()
                    // Spring Data Elasticsearch Criteria.fuzzy(..) takes a single term.
                    // Earlier versions accepted an additional float parameter; keep compatibility
                    // with current dependency versions by using the supported signature.
                    .or("title").fuzzy(query)
                    .or("description").fuzzy(query)
                    .or("address").fuzzy(query);
            criteria = criteria.and(queryCriteria);
        }

        if (filters != null) {
            if (filters.containsKey("status")) {
                criteria = criteria.and(new Criteria("status").is(filters.get("status")));
            }
            if (filters.containsKey("city")) {
                criteria = criteria.and(new Criteria("city").is(filters.get("city")));
            }
            if (filters.containsKey("type")) {
                criteria = criteria.and(new Criteria("type").is(filters.get("type")));
            }
        }

        Query searchQuery = new CriteriaQuery(criteria).setPageable(PageRequest.of(page, size));
        return elasticsearchOperations.search(searchQuery, AnnonceDocument.class);
    }

    private SearchHits<DossierDocument> searchDossiers(String query, Map<String, Object> filters, String orgId, int page, int size) {
        Criteria criteria = new Criteria("orgId").is(orgId);

        if (query != null && !query.isBlank()) {
            Criteria queryCriteria = new Criteria()
                    .or("leadName").fuzzy(query)
                    .or("notes").fuzzy(query);
            criteria = criteria.and(queryCriteria);
        }

        if (filters != null) {
            if (filters.containsKey("status")) {
                criteria = criteria.and(new Criteria("status").is(filters.get("status")));
            }
            if (filters.containsKey("source")) {
                criteria = criteria.and(new Criteria("source").is(filters.get("source")));
            }
        }

        Query searchQuery = new CriteriaQuery(criteria).setPageable(PageRequest.of(page, size));
        return elasticsearchOperations.search(searchQuery, DossierDocument.class);
    }

    private List<SearchResultDto> convertAnnonceHits(SearchHits<AnnonceDocument> hits) {
        return hits.getSearchHits().stream()
                .map(hit -> {
                    AnnonceDocument doc = hit.getContent();
                    return new SearchResultDto(
                            doc.getId(),
                            "annonce",
                            doc.getTitle(),
                            doc.getDescription(),
                            (double) hit.getScore(),
                            doc.getCreatedAt(),
                            doc.getUpdatedAt()
                    );
                })
                .collect(Collectors.toList());
    }

    private List<SearchResultDto> convertDossierHits(SearchHits<DossierDocument> hits) {
        return hits.getSearchHits().stream()
                .map(hit -> {
                    DossierDocument doc = hit.getContent();
                    String title = "Dossier - " + (doc.getLeadName() != null ? doc.getLeadName() : "No name");
                    return new SearchResultDto(
                            doc.getId(),
                            "dossier",
                            title,
                            doc.getNotes(),
                            (double) hit.getScore(),
                            doc.getCreatedAt(),
                            doc.getUpdatedAt()
                    );
                })
                .collect(Collectors.toList());
    }

    private SearchResponseDto searchWithPostgreSQL(String query, String type, Map<String, Object> filters, String orgId, int page, int size) {
        List<SearchResultDto> results = new ArrayList<>();
        long totalHits = 0;

        if (type == null || type.equalsIgnoreCase("annonce")) {
            List<Annonce> annonces = searchAnnoncesPostgres(query, filters, page, size);
            results.addAll(convertAnnoncesToResults(annonces));
            totalHits += annonces.size();
        }

        if (type == null || type.equalsIgnoreCase("dossier")) {
            List<Dossier> dossiers = searchDossiersPostgres(query, filters, page, size);
            results.addAll(convertDossiersToResults(dossiers));
            totalHits += dossiers.size();
        }

        return new SearchResponseDto(results, totalHits, false);
    }

    private List<Annonce> searchAnnoncesPostgres(String query, Map<String, Object> filters, int page, int size) {
        StringBuilder sql = new StringBuilder(
                "SELECT a.* FROM annonce a WHERE a.org_id = :orgId"
        );

        if (query != null && !query.isBlank()) {
            sql.append(" AND (");
            sql.append("to_tsvector('simple', COALESCE(a.title, '')) @@ plainto_tsquery('simple', :query)");
            sql.append(" OR to_tsvector('simple', COALESCE(a.description, '')) @@ plainto_tsquery('simple', :query)");
            sql.append(" OR to_tsvector('simple', COALESCE(a.address, '')) @@ plainto_tsquery('simple', :query)");
            sql.append(")");
        }

        if (filters != null) {
            if (filters.containsKey("status")) {
                sql.append(" AND a.status = :status");
            }
            if (filters.containsKey("city")) {
                sql.append(" AND a.city = :city");
            }
            if (filters.containsKey("type")) {
                sql.append(" AND a.type = :type");
            }
        }

        sql.append(" ORDER BY a.updated_at DESC");
        sql.append(" LIMIT :limit OFFSET :offset");

        jakarta.persistence.Query nativeQuery = entityManager.createNativeQuery(sql.toString(), Annonce.class);
        nativeQuery.setParameter("orgId", TenantContext.getOrgId());

        if (query != null && !query.isBlank()) {
            nativeQuery.setParameter("query", query);
        }

        if (filters != null) {
            if (filters.containsKey("status")) {
                nativeQuery.setParameter("status", filters.get("status").toString());
            }
            if (filters.containsKey("city")) {
                nativeQuery.setParameter("city", filters.get("city"));
            }
            if (filters.containsKey("type")) {
                nativeQuery.setParameter("type", filters.get("type").toString());
            }
        }

        nativeQuery.setParameter("limit", size);
        nativeQuery.setParameter("offset", page * size);

        @SuppressWarnings("unchecked")
        List<Annonce> results = nativeQuery.getResultList();
        return results;
    }

    private List<Dossier> searchDossiersPostgres(String query, Map<String, Object> filters, int page, int size) {
        StringBuilder sql = new StringBuilder(
                "SELECT d.* FROM dossier d WHERE d.org_id = :orgId"
        );

        if (query != null && !query.isBlank()) {
            sql.append(" AND (");
            sql.append("to_tsvector('simple', COALESCE(d.lead_name, '')) @@ plainto_tsquery('simple', :query)");
            sql.append(" OR to_tsvector('simple', COALESCE(d.notes, '')) @@ plainto_tsquery('simple', :query)");
            sql.append(")");
        }

        if (filters != null) {
            if (filters.containsKey("status")) {
                sql.append(" AND d.status = :status");
            }
            if (filters.containsKey("source")) {
                sql.append(" AND d.source = :source");
            }
        }

        sql.append(" ORDER BY d.updated_at DESC");
        sql.append(" LIMIT :limit OFFSET :offset");

        jakarta.persistence.Query nativeQuery = entityManager.createNativeQuery(sql.toString(), Dossier.class);
        nativeQuery.setParameter("orgId", TenantContext.getOrgId());

        if (query != null && !query.isBlank()) {
            nativeQuery.setParameter("query", query);
        }

        if (filters != null) {
            if (filters.containsKey("status")) {
                nativeQuery.setParameter("status", filters.get("status").toString());
            }
            if (filters.containsKey("source")) {
                nativeQuery.setParameter("source", filters.get("source").toString());
            }
        }

        nativeQuery.setParameter("limit", size);
        nativeQuery.setParameter("offset", page * size);

        @SuppressWarnings("unchecked")
        List<Dossier> results = nativeQuery.getResultList();
        return results;
    }

    private List<SearchResultDto> convertAnnoncesToResults(List<Annonce> annonces) {
        return annonces.stream()
                .map(a -> new SearchResultDto(
                        a.getId(),
                        "annonce",
                        a.getTitle(),
                        a.getDescription(),
                        1.0,
                        a.getCreatedAt(),
                        a.getUpdatedAt()
                ))
                .collect(Collectors.toList());
    }

    private List<SearchResultDto> convertDossiersToResults(List<Dossier> dossiers) {
        return dossiers.stream()
                .map(d -> {
                    String title = "Dossier - " + (d.getLeadName() != null ? d.getLeadName() : "No name");
                    return new SearchResultDto(
                            d.getId(),
                            "dossier",
                            title,
                            d.getNotes(),
                            1.0,
                            d.getCreatedAt(),
                            d.getUpdatedAt()
                    );
                })
                .collect(Collectors.toList());
    }

    private boolean isElasticsearchAvailable() {
        return elasticsearchOperations != null && annonceSearchRepository != null && dossierSearchRepository != null;
    }

    public void indexAnnonce(Annonce annonce) {
        if (!isElasticsearchAvailable()) {
            return;
        }

        try {
            AnnonceDocument doc = new AnnonceDocument();
            doc.setId(annonce.getId());
            doc.setOrgId(annonce.getOrgId());
            doc.setTitle(annonce.getTitle());
            doc.setDescription(annonce.getDescription());
            doc.setAddress(annonce.getAddress());
            doc.setCategory(annonce.getCategory());
            doc.setType(annonce.getType() != null ? annonce.getType().name() : null);
            doc.setCity(annonce.getCity());
            doc.setSurface(annonce.getSurface());
            doc.setPrice(annonce.getPrice());
            doc.setCurrency(annonce.getCurrency());
            doc.setStatus(annonce.getStatus() != null ? annonce.getStatus().name() : null);
            doc.setCreatedAt(annonce.getCreatedAt());
            doc.setUpdatedAt(annonce.getUpdatedAt());

            annonceSearchRepository.save(doc);
        } catch (Exception e) {
            logger.warn("Failed to index annonce {}: {}", annonce.getId(), e.getMessage());
        }
    }

    public void indexDossier(Dossier dossier) {
        if (!isElasticsearchAvailable()) {
            return;
        }

        try {
            DossierDocument doc = new DossierDocument();
            doc.setId(dossier.getId());
            doc.setOrgId(dossier.getOrgId());
            doc.setLeadName(dossier.getLeadName());
            doc.setLeadPhone(dossier.getLeadPhone());
            doc.setNotes(dossier.getNotes());
            doc.setStatus(dossier.getStatus() != null ? dossier.getStatus().name() : null);
            doc.setCaseType(dossier.getCaseType());
            doc.setStatusCode(dossier.getStatusCode());
            doc.setLossReason(dossier.getLossReason());
            doc.setWonReason(dossier.getWonReason());
            doc.setSource(dossier.getSource() != null ? dossier.getSource().name() : null);
            doc.setLeadSource(dossier.getLeadSource());
            doc.setScore(dossier.getScore());
            doc.setAnnonceId(dossier.getAnnonceId());
            doc.setCreatedAt(dossier.getCreatedAt());
            doc.setUpdatedAt(dossier.getUpdatedAt());

            dossierSearchRepository.save(doc);
        } catch (Exception e) {
            logger.warn("Failed to index dossier {}: {}", dossier.getId(), e.getMessage());
        }
    }

    public void deleteAnnonceIndex(Long id) {
        if (!isElasticsearchAvailable()) {
            return;
        }

        try {
            annonceSearchRepository.deleteById(id);
        } catch (Exception e) {
            logger.warn("Failed to delete annonce index {}: {}", id, e.getMessage());
        }
    }

    public void deleteDossierIndex(Long id) {
        if (!isElasticsearchAvailable()) {
            return;
        }

        try {
            dossierSearchRepository.deleteById(id);
        } catch (Exception e) {
            logger.warn("Failed to delete dossier index {}: {}", id, e.getMessage());
        }
    }
}
