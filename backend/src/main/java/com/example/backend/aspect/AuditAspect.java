package com.example.backend.aspect;

import com.example.backend.entity.AuditEventEntity;
import com.example.backend.entity.enums.AuditAction;
import com.example.backend.entity.enums.AuditEntityType;
import com.example.backend.repository.AuditEventRepository;
import com.example.backend.util.TenantContext;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.annotation.Around;
import org.aspectj.lang.annotation.Aspect;
import org.aspectj.lang.reflect.MethodSignature;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Component;

import java.lang.reflect.Method;
import java.util.HashMap;
import java.util.Map;

@Aspect
@Component
public class AuditAspect {

    private final AuditEventRepository auditEventRepository;
    private final ObjectMapper objectMapper;

    public AuditAspect(AuditEventRepository auditEventRepository) {
        this.auditEventRepository = auditEventRepository;
        this.objectMapper = new ObjectMapper();
    }

    @Around("execution(* com.example.backend.service.*Service.create*(..)) || " +
            "execution(* com.example.backend.service.*Service.update*(..)) || " +
            "execution(* com.example.backend.service.*Service.delete*(..)) || " +
            "execution(* com.example.backend.service.*Service.patch*(..))")
    public Object auditServiceMethod(ProceedingJoinPoint joinPoint) throws Throwable {
        MethodSignature signature = (MethodSignature) joinPoint.getSignature();
        Method method = signature.getMethod();
        String methodName = method.getName();

        Object[] args = joinPoint.getArgs();
        Object entityBefore = null;
        Long entityId = null;

        if (methodName.startsWith("update") || methodName.startsWith("patch") || methodName.startsWith("delete")) {
            entityId = extractEntityIdFromArgs(args);
            entityBefore = captureBeforeState(joinPoint, entityId);
        }

        Object result = joinPoint.proceed();

        try {
            AuditAction action = determineAction(methodName);
            AuditEntityType entityType = extractEntityType(joinPoint);
            
            if (entityId == null) {
                entityId = extractEntityIdFromResult(result);
            }

            if (entityId != null && entityType != null) {
                String userId = extractUserId();
                String orgId = TenantContext.getOrgId();
                Map<String, Object> diff = calculateDiff(entityBefore, result, action);

                AuditEventEntity auditEvent = new AuditEventEntity();
                auditEvent.setEntityType(entityType);
                auditEvent.setEntityId(entityId);
                auditEvent.setAction(action);
                auditEvent.setUserId(userId);
                auditEvent.setOrgId(orgId);
                auditEvent.setDiff(diff);

                auditEventRepository.save(auditEvent);
            }
        } catch (Exception e) {
        }

        return result;
    }

    private AuditAction determineAction(String methodName) {
        String lowerMethodName = methodName.toLowerCase();
        if (lowerMethodName.startsWith("create")) {
            return AuditAction.CREATED;
        } else if (lowerMethodName.startsWith("update") || lowerMethodName.startsWith("patch")) {
            return AuditAction.UPDATED;
        } else if (lowerMethodName.startsWith("delete")) {
            return AuditAction.DELETED;
        }
        return AuditAction.UPDATED;
    }

    private AuditEntityType extractEntityType(ProceedingJoinPoint joinPoint) {
        String className = joinPoint.getTarget().getClass().getSimpleName();
        String entityName = className.replace("Service", "").toLowerCase();

        if (entityName.contains("annonce")) {
            return AuditEntityType.ANNONCE;
        } else if (entityName.contains("dossier")) {
            return AuditEntityType.DOSSIER;
        } else if (entityName.contains("partieprenante")) {
            return AuditEntityType.PARTIE_PRENANTE;
        } else if (entityName.contains("consentement")) {
            return AuditEntityType.CONSENTEMENT;
        } else if (entityName.contains("message")) {
            return AuditEntityType.MESSAGE;
        } else if (entityName.contains("user")) {
            return AuditEntityType.USER;
        } else if (entityName.contains("organization")) {
            return AuditEntityType.ORGANIZATION;
        }

        return null;
    }

    private Long extractEntityIdFromArgs(Object[] args) {
        if (args != null && args.length > 0) {
            if (args[0] instanceof Long) {
                return (Long) args[0];
            }
        }
        return null;
    }

    private Long extractEntityIdFromResult(Object result) {
        if (result == null) {
            return null;
        }

        try {
            Method getIdMethod = result.getClass().getMethod("getId");
            Object idValue = getIdMethod.invoke(result);
            if (idValue instanceof Long) {
                return (Long) idValue;
            }
        } catch (Exception e) {
        }

        return null;
    }

    private String extractUserId() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication != null && authentication.isAuthenticated()) {
            Object principal = authentication.getPrincipal();
            if (principal instanceof Jwt) {
                Jwt jwt = (Jwt) principal;
                String sub = jwt.getSubject();
                if (sub != null) {
                    return sub;
                }
            }
            return authentication.getName();
        }
        return null;
    }

    private Object captureBeforeState(ProceedingJoinPoint joinPoint, Long entityId) {
        if (entityId == null) {
            return null;
        }

        try {
            Object service = joinPoint.getTarget();
            Method getByIdMethod = service.getClass().getMethod("getById", Long.class);
            return getByIdMethod.invoke(service, entityId);
        } catch (Exception e) {
            return null;
        }
    }

    private Map<String, Object> calculateDiff(Object before, Object after, AuditAction action) {
        Map<String, Object> diff = new HashMap<>();

        if (action == AuditAction.CREATED) {
            diff.put("after", convertToMap(after));
        } else if (action == AuditAction.DELETED) {
            diff.put("before", convertToMap(before));
        } else if (action == AuditAction.UPDATED) {
            Map<String, Object> beforeMap = convertToMap(before);
            Map<String, Object> afterMap = convertToMap(after);

            if (beforeMap != null && afterMap != null) {
                Map<String, Object> changes = new HashMap<>();
                for (String key : afterMap.keySet()) {
                    Object beforeValue = beforeMap.get(key);
                    Object afterValue = afterMap.get(key);
                    if (!java.util.Objects.equals(beforeValue, afterValue)) {
                        Map<String, Object> change = new HashMap<>();
                        change.put("before", beforeValue);
                        change.put("after", afterValue);
                        changes.put(key, change);
                    }
                }
                diff.put("changes", changes);
            }
        }

        return diff;
    }

    private Map<String, Object> convertToMap(Object obj) {
        if (obj == null) {
            return null;
        }

        try {
            return objectMapper.convertValue(obj, Map.class);
        } catch (Exception e) {
            return null;
        }
    }
}
