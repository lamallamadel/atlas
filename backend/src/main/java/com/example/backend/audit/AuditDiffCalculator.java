package com.example.backend.audit;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.stereotype.Component;

import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.Map;
import java.util.Objects;
import java.util.Set;

@Component
public class AuditDiffCalculator {

    private final ObjectMapper objectMapper;

    public AuditDiffCalculator(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
    }

    public Map<String, Object> buildDiff(Object before, Object after) {
        Map<String, Object> beforeMap = toMap(before);
        Map<String, Object> afterMap = toMap(after);

        Map<String, Object> changes = new LinkedHashMap<>();

        Set<String> keys = new LinkedHashSet<>();
        if (beforeMap != null) keys.addAll(beforeMap.keySet());
        if (afterMap != null) keys.addAll(afterMap.keySet());

        for (String k : keys) {
            Object b = beforeMap == null ? null : beforeMap.get(k);
            Object a = afterMap == null ? null : afterMap.get(k);

            if (!Objects.equals(b, a)) {
                Map<String, Object> change = new LinkedHashMap<>();
                change.put("before", b);
                change.put("after", a);
                changes.put(k, change);
            }
        }

        Map<String, Object> diff = new LinkedHashMap<>();
        diff.put("before", beforeMap);
        diff.put("after", afterMap);
        diff.put("changes", changes); // ALWAYS present
        return diff;
    }

    private Map<String, Object> toMap(Object value) {
        if (value == null) return null;
        try {
            // Produces full snapshot incl. complex fields
            return objectMapper.convertValue(value, new TypeReference<LinkedHashMap<String, Object>>() {});
        } catch (Exception e) {
            // Never return null; tests require not-null diff in many places.
            Map<String, Object> fallback = new LinkedHashMap<>();
            fallback.put("_serializationError", e.getClass().getSimpleName());
            fallback.put("_message", e.getMessage());
            fallback.put("_toString", String.valueOf(value));
            return fallback;
        }
    }
}
