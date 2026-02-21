package com.example.backend.filter;

import com.example.backend.config.Deprecated;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import org.springframework.core.annotation.AnnotationUtils;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;
import org.springframework.web.method.HandlerMethod;
import org.springframework.web.servlet.HandlerExecutionChain;
import org.springframework.web.servlet.mvc.method.annotation.RequestMappingHandlerMapping;

@Component
public class DeprecationFilter extends OncePerRequestFilter {

    private final RequestMappingHandlerMapping requestMappingHandlerMapping;

    public DeprecationFilter(RequestMappingHandlerMapping requestMappingHandlerMapping) {
        this.requestMappingHandlerMapping = requestMappingHandlerMapping;
    }

    @Override
    protected void doFilterInternal(
            HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {

        try {
            HandlerExecutionChain handler = requestMappingHandlerMapping.getHandler(request);
            if (handler != null && handler.getHandler() instanceof HandlerMethod) {
                HandlerMethod handlerMethod = (HandlerMethod) handler.getHandler();

                Deprecated methodDeprecation = handlerMethod.getMethodAnnotation(Deprecated.class);
                Deprecated classDeprecation =
                        AnnotationUtils.findAnnotation(
                                handlerMethod.getBeanType(), Deprecated.class);

                Deprecated deprecation =
                        methodDeprecation != null ? methodDeprecation : classDeprecation;

                if (deprecation != null) {
                    response.addHeader("Deprecation", "true");
                    response.addHeader("Sunset", deprecation.sunsetDate());
                    response.addHeader(
                            "Link",
                            "<https://docs.example.com/api-migration>; rel=\"deprecation\"; type=\"text/html\"");
                    response.addHeader("X-API-Warn", deprecation.deprecationMessage());
                }
            }
        } catch (Exception e) {
        }

        filterChain.doFilter(request, response);
    }
}
