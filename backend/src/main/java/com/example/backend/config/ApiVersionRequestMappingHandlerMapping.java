package com.example.backend.config;

import org.springframework.core.annotation.AnnotationUtils;
import org.springframework.web.servlet.mvc.condition.PatternsRequestCondition;
import org.springframework.web.servlet.mvc.method.RequestMappingInfo;
import org.springframework.web.servlet.mvc.method.annotation.RequestMappingHandlerMapping;

import java.lang.reflect.Method;

public class ApiVersionRequestMappingHandlerMapping extends RequestMappingHandlerMapping {

    @Override
    protected RequestMappingInfo getMappingForMethod(Method method, Class<?> handlerType) {
        RequestMappingInfo info = super.getMappingForMethod(method, handlerType);
        if (info == null) {
            return null;
        }

        ApiVersion apiVersion = AnnotationUtils.findAnnotation(handlerType, ApiVersion.class);
        if (apiVersion != null) {
            String version = apiVersion.value();
            PatternsRequestCondition patterns = info.getPatternsCondition();
            if (patterns != null) {
                String[] newPatterns = patterns.getPatterns().stream()
                        .map(pattern -> "/api/" + version + pattern.replaceFirst("^/api/v[0-9]+", ""))
                        .toArray(String[]::new);
                
                PatternsRequestCondition apiPattern = new PatternsRequestCondition(newPatterns);
                info = new RequestMappingInfo(
                        info.getName(),
                        apiPattern,
                        info.getMethodsCondition(),
                        info.getParamsCondition(),
                        info.getHeadersCondition(),
                        info.getConsumesCondition(),
                        info.getProducesCondition(),
                        info.getCustomCondition()
                );
            }
        }

        return info;
    }
}
