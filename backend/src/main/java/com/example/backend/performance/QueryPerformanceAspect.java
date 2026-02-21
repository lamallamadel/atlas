package com.example.backend.performance;

import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.annotation.Around;
import org.aspectj.lang.annotation.Aspect;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;

@Aspect
@Component
@ConditionalOnProperty(name = "performance.query.profiling.enabled", havingValue = "true")
public class QueryPerformanceAspect {

    private static final Logger logger = LoggerFactory.getLogger(QueryPerformanceAspect.class);
    private static final long SLOW_QUERY_THRESHOLD_MS = 1000;

    @Around("execution(* com.example.backend.repository..*(..))")
    public Object profileRepositoryMethod(ProceedingJoinPoint joinPoint) throws Throwable {
        long startTime = System.currentTimeMillis();
        String methodName = joinPoint.getSignature().toShortString();
        
        try {
            Object result = joinPoint.proceed();
            long executionTime = System.currentTimeMillis() - startTime;
            
            if (executionTime > SLOW_QUERY_THRESHOLD_MS) {
                logger.warn("🐌 SLOW QUERY DETECTED: {} took {}ms", methodName, executionTime);
            } else if (executionTime > 500) {
                logger.info("⚡ Query performance: {} took {}ms", methodName, executionTime);
            }
            
            return result;
        } catch (Exception e) {
            long executionTime = System.currentTimeMillis() - startTime;
            logger.error("❌ Query failed: {} after {}ms", methodName, executionTime, e);
            throw e;
        }
    }

    @Around("execution(* com.example.backend.service..*(..))")
    public Object profileServiceMethod(ProceedingJoinPoint joinPoint) throws Throwable {
        long startTime = System.currentTimeMillis();
        String methodName = joinPoint.getSignature().toShortString();
        
        try {
            Object result = joinPoint.proceed();
            long executionTime = System.currentTimeMillis() - startTime;
            
            if (executionTime > 2000) {
                logger.warn("🐌 SLOW SERVICE METHOD: {} took {}ms", methodName, executionTime);
            }
            
            return result;
        } catch (Exception e) {
            long executionTime = System.currentTimeMillis() - startTime;
            logger.error("❌ Service method failed: {} after {}ms", methodName, executionTime, e);
            throw e;
        }
    }
}
