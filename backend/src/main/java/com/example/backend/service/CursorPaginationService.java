package com.example.backend.service;

import com.example.backend.dto.CursorPageRequest;
import com.example.backend.dto.CursorPageResponse;
import jakarta.persistence.EntityManager;
import jakarta.persistence.TypedQuery;
import jakarta.persistence.criteria.*;
import java.util.ArrayList;
import java.util.Base64;
import java.util.List;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;

@Service
public class CursorPaginationService {

    private final EntityManager entityManager;

    public CursorPaginationService(EntityManager entityManager) {
        this.entityManager = entityManager;
    }

    public <T> CursorPageResponse<T> findWithCursor(
            Class<T> entityClass,
            CursorPageRequest pageRequest,
            List<Predicate> additionalPredicates) {

        CriteriaBuilder cb = entityManager.getCriteriaBuilder();
        CriteriaQuery<T> query = cb.createQuery(entityClass);
        Root<T> root = query.from(entityClass);

        List<Predicate> predicates = new ArrayList<>();
        if (additionalPredicates != null) {
            predicates.addAll(additionalPredicates);
        }

        String sortField = pageRequest.getSortField();
        Sort.Direction direction = pageRequest.getDirection();

        if (pageRequest.getCursor() != null) {
            Long cursorValue = decodeCursor(pageRequest.getCursor());
            if (cursorValue != null) {
                if (direction == Sort.Direction.DESC) {
                    predicates.add(cb.lessThan(root.get(sortField), cursorValue));
                } else {
                    predicates.add(cb.greaterThan(root.get(sortField), cursorValue));
                }
            }
        }

        query.where(predicates.toArray(new Predicate[0]));

        if (direction == Sort.Direction.DESC) {
            query.orderBy(cb.desc(root.get(sortField)));
        } else {
            query.orderBy(cb.asc(root.get(sortField)));
        }

        TypedQuery<T> typedQuery = entityManager.createQuery(query);
        typedQuery.setMaxResults(pageRequest.getLimit() + 1);

        List<T> results = typedQuery.getResultList();

        boolean hasNext = results.size() > pageRequest.getLimit();
        if (hasNext) {
            results = results.subList(0, pageRequest.getLimit());
        }

        String nextCursor = null;
        String previousCursor = null;

        if (!results.isEmpty()) {
            T lastItem = results.get(results.size() - 1);
            nextCursor = hasNext ? encodeCursor(getFieldValue(lastItem, sortField)) : null;

            T firstItem = results.get(0);
            previousCursor = encodeCursor(getFieldValue(firstItem, sortField));
        }

        return new CursorPageResponse<>(
                results, nextCursor, previousCursor, hasNext, pageRequest.getCursor() != null);
    }

    private String encodeCursor(Object value) {
        if (value == null) {
            return null;
        }
        return Base64.getEncoder().encodeToString(value.toString().getBytes());
    }

    private Long decodeCursor(String cursor) {
        try {
            String decoded = new String(Base64.getDecoder().decode(cursor));
            return Long.parseLong(decoded);
        } catch (Exception e) {
            return null;
        }
    }

    private Object getFieldValue(Object entity, String fieldName) {
        try {
            String methodName =
                    "get" + fieldName.substring(0, 1).toUpperCase() + fieldName.substring(1);
            return entity.getClass().getMethod(methodName).invoke(entity);
        } catch (Exception e) {
            return null;
        }
    }
}
