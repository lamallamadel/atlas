package com.example.backend.config;

import org.springframework.beans.factory.ObjectProvider;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.InterceptorRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class WebConfig implements WebMvcConfigurer {

    private final ObjectProvider<HibernateFilterInterceptor> interceptorProvider;

    public WebConfig(ObjectProvider<HibernateFilterInterceptor> interceptorProvider) {
        this.interceptorProvider = interceptorProvider;
    }

    @Override
    public void addInterceptors(InterceptorRegistry registry) {
        HibernateFilterInterceptor interceptor = interceptorProvider.getIfAvailable();
        if (interceptor != null) {
            registry.addInterceptor(interceptor);
        }
    }

    @Configuration
    @Profile({"local", "e2e"})
    public static class LocalCorsConfig implements WebMvcConfigurer {
        @Override
        public void addCorsMappings(CorsRegistry registry) {
            registry.addMapping("/**").allowedOrigins("*").allowedMethods("*").allowedHeaders("*");
        }
    }

    @Configuration
    @Profile("prod")
    public static class ProdCorsConfig implements WebMvcConfigurer {

        @Value("${cors.allowed-origins}")
        private String[] allowedOrigins;

        @Override
        public void addCorsMappings(CorsRegistry registry) {
            registry.addMapping("/**")
                    .allowedOrigins(allowedOrigins)
                    .allowedMethods("GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS")
                    .allowedHeaders("*")
                    .allowCredentials(true);
        }
    }
}
