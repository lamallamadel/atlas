package com.example.backend.service;

import com.example.backend.dto.DossierFilterRequest;
import com.example.backend.dto.DossierMapper;
import com.example.backend.dto.DossierResponse;
import com.example.backend.entity.Dossier;
import com.example.backend.entity.enums.DossierStatus;
import com.example.backend.repository.DossierRepository;
import jakarta.persistence.criteria.*;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.TemporalAdjusters;
import java.util.ArrayList;
import java.util.List;

@Service
@Transactional(readOnly = true)
public class DossierAdvancedFilterService {

    private final DossierRepository dossierRepository;
    private final DossierMapper dossierMapper;

    public DossierAdvancedFilterService(
            DossierRepository dossierRepository,
            DossierMapper dossierMapper) {
        this.dossierRepository = dossierRepository;
        this.dossierMapper = dossierMapper;
    }

    public Page<DossierResponse> filterDossiers(DossierFilterRequest filterRequest) {
        Specification<Dossier> spec = buildSpecification(filterRequest);
        
        int page = filterRequest.getPage() != null ? filterRequest.getPage() : 0;
        int size = filterRequest.getSize() != null ? filterRequest.getSize() : 20;
        Pageable pageable = PageRequest.of(page, size);
        
        Page<Dossier> dossiers = dossierRepository.findAll(spec, pageable);
        return dossiers.map(dossierMapper::toResponse);
    }

    public Long countDossiers(DossierFilterRequest filterRequest) {
        Specification<Dossier> spec = buildSpecification(filterRequest);
        return dossierRepository.count(spec);
    }

    private Specification<Dossier> buildSpecification(DossierFilterRequest filterRequest) {
        return (root, query, criteriaBuilder) -> {
            List<Predicate> predicates = new ArrayList<>();
            
            if (filterRequest.getConditions() != null && !filterRequest.getConditions().isEmpty()) {
                for (DossierFilterRequest.FilterCondition condition : filterRequest.getConditions()) {
                    Predicate predicate = buildPredicate(root, criteriaBuilder, condition);
                    if (predicate != null) {
                        predicates.add(predicate);
                    }
                }
            }
            
            if (predicates.isEmpty()) {
                return criteriaBuilder.conjunction();
            }
            
            String logicOperator = filterRequest.getLogicOperator() != null 
                    ? filterRequest.getLogicOperator().toUpperCase() 
                    : "AND";
            
            if ("OR".equals(logicOperator)) {
                return criteriaBuilder.or(predicates.toArray(new Predicate[0]));
            } else {
                return criteriaBuilder.and(predicates.toArray(new Predicate[0]));
            }
        };
    }

    private Predicate buildPredicate(Root<Dossier> root, CriteriaBuilder cb, DossierFilterRequest.FilterCondition condition) {
        String field = condition.getField();
        String operator = condition.getOperator();
        Object value = condition.getValue();

        try {
            switch (operator.toUpperCase()) {
                case "EQUALS":
                    return buildEqualsPredicate(root, cb, field, value);
                
                case "NOT_EQUALS":
                    return cb.notEqual(getPath(root, field), value);
                
                case "CONTAINS":
                    return cb.like(cb.lower(root.get(field).as(String.class)), 
                            "%" + String.valueOf(value).toLowerCase() + "%");
                
                case "NOT_CONTAINS":
                    return cb.notLike(cb.lower(root.get(field).as(String.class)), 
                            "%" + String.valueOf(value).toLowerCase() + "%");
                
                case "STARTS_WITH":
                    return cb.like(cb.lower(root.get(field).as(String.class)), 
                            String.valueOf(value).toLowerCase() + "%");
                
                case "ENDS_WITH":
                    return cb.like(cb.lower(root.get(field).as(String.class)), 
                            "%" + String.valueOf(value).toLowerCase());
                
                case "IN":
                    if (value instanceof List) {
                        List<?> values = (List<?>) value;
                        if ("status".equals(field)) {
                            List<DossierStatus> statuses = new ArrayList<>();
                            for (Object v : values) {
                                statuses.add(DossierStatus.valueOf(String.valueOf(v)));
                            }
                            return root.get(field).in(statuses);
                        }
                        return root.get(field).in(values);
                    }
                    return null;
                
                case "NOT_IN":
                    if (value instanceof List) {
                        List<?> values = (List<?>) value;
                        if ("status".equals(field)) {
                            List<DossierStatus> statuses = new ArrayList<>();
                            for (Object v : values) {
                                statuses.add(DossierStatus.valueOf(String.valueOf(v)));
                            }
                            return cb.not(root.get(field).in(statuses));
                        }
                        return cb.not(root.get(field).in(values));
                    }
                    return null;
                
                case "GREATER_THAN":
                    return buildComparisonPredicate(root, cb, field, value, "GT");
                
                case "GREATER_THAN_OR_EQUAL":
                    return buildComparisonPredicate(root, cb, field, value, "GTE");
                
                case "LESS_THAN":
                    return buildComparisonPredicate(root, cb, field, value, "LT");
                
                case "LESS_THAN_OR_EQUAL":
                    return buildComparisonPredicate(root, cb, field, value, "LTE");
                
                case "BETWEEN":
                    if (value instanceof List && ((List<?>) value).size() == 2) {
                        List<?> range = (List<?>) value;
                        Path path = getPath(root, field);
                        Object val1 = range.get(0);
                        Object val2 = range.get(1);
                        
                        if (val1 instanceof Integer && val2 instanceof Integer) {
                            return cb.between(path.as(Integer.class), (Integer) val1, (Integer) val2);
                        } else if (val1 instanceof Long && val2 instanceof Long) {
                            return cb.between(path.as(Long.class), (Long) val1, (Long) val2);
                        } else if (val1 instanceof Double && val2 instanceof Double) {
                            return cb.between(path.as(Double.class), (Double) val1, (Double) val2);
                        } else if (val1 instanceof LocalDateTime && val2 instanceof LocalDateTime) {
                            return cb.between(path.as(LocalDateTime.class), (LocalDateTime) val1, (LocalDateTime) val2);
                        } else if (val1 instanceof LocalDate && val2 instanceof LocalDate) {
                            return cb.between(path.as(LocalDate.class), (LocalDate) val1, (LocalDate) val2);
                        } else if (val1 instanceof String && val2 instanceof String) {
                            return cb.between(path.as(String.class), (String) val1, (String) val2);
                        }
                    }
                    return null;
                
                case "IS_NULL":
                    return cb.isNull(getPath(root, field));
                
                case "IS_NOT_NULL":
                    return cb.isNotNull(getPath(root, field));
                
                case "EQUALS_CURRENT_USER":
                    return cb.equal(root.get(field), getCurrentUserId());
                
                case "EQUALS_TODAY":
                    LocalDateTime startOfDay = LocalDate.now().atStartOfDay();
                    LocalDateTime endOfDay = startOfDay.plusDays(1);
                    return cb.between(root.get(field).as(LocalDateTime.class), startOfDay, endOfDay);
                
                case "THIS_WEEK":
                    LocalDate now = LocalDate.now();
                    LocalDate startOfWeek = now.with(TemporalAdjusters.previousOrSame(java.time.DayOfWeek.MONDAY));
                    LocalDate endOfWeek = now.with(TemporalAdjusters.nextOrSame(java.time.DayOfWeek.SUNDAY));
                    return cb.between(root.get(field).as(LocalDate.class), startOfWeek, endOfWeek);
                
                case "LESS_THAN_DAYS_AGO":
                    int days = Integer.parseInt(String.valueOf(value));
                    LocalDateTime threshold = LocalDateTime.now().minusDays(days);
                    return cb.greaterThanOrEqualTo(root.get(field).as(LocalDateTime.class), threshold);
                
                default:
                    return null;
            }
        } catch (Exception e) {
            return null;
        }
    }

    private Predicate buildEqualsPredicate(Root<Dossier> root, CriteriaBuilder cb, String field, Object value) {
        if ("status".equals(field)) {
            DossierStatus status = DossierStatus.valueOf(String.valueOf(value));
            return cb.equal(root.get(field), status);
        }
        return cb.equal(getPath(root, field), value);
    }

    private Predicate buildComparisonPredicate(Root<Dossier> root, CriteriaBuilder cb, 
            String field, Object value, String comparisonType) {
        Path<?> path = getPath(root, field);
        
        if (value instanceof Number) {
            Number numValue = (Number) value;
            switch (comparisonType) {
                case "GT":
                    return cb.gt(path.as(Number.class), numValue);
                case "GTE":
                    return cb.ge(path.as(Number.class), numValue);
                case "LT":
                    return cb.lt(path.as(Number.class), numValue);
                case "LTE":
                    return cb.le(path.as(Number.class), numValue);
            }
        } else if (value instanceof LocalDateTime) {
            LocalDateTime dateValue = (LocalDateTime) value;
            switch (comparisonType) {
                case "GT":
                    return cb.greaterThan(path.as(LocalDateTime.class), dateValue);
                case "GTE":
                    return cb.greaterThanOrEqualTo(path.as(LocalDateTime.class), dateValue);
                case "LT":
                    return cb.lessThan(path.as(LocalDateTime.class), dateValue);
                case "LTE":
                    return cb.lessThanOrEqualTo(path.as(LocalDateTime.class), dateValue);
            }
        }
        
        return null;
    }

    private Path<?> getPath(Root<Dossier> root, String field) {
        if (field.contains(".")) {
            String[] parts = field.split("\\.");
            Path<?> path = root;
            for (String part : parts) {
                path = path.get(part);
            }
            return path;
        }
        return root.get(field);
    }

    private String getCurrentUserId() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()) {
            return "system";
        }
        return authentication.getName();
    }
}
