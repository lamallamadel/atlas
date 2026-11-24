package com.example.backend.config;

import com.example.backend.entitlement.RequiresFeatureInterceptor;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;
import org.springframework.core.Ordered;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.InterceptorRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class WebConfig implements WebMvcConfigurer {

    private final ObjectProvider<HibernateFilterInterceptor> interceptorProvider;
    private final ObjectProvider<RequiresFeatureInterceptor> featureInterceptorProvider;

    public WebConfig(
            ObjectProvider<HibernateFilterInterceptor> interceptorProvider,
            ObjectProvider<RequiresFeatureInterceptor> featureInterceptorProvider) {
        this.interceptorProvider = interceptorProvider;
        this.featureInterceptorProvider = featureInterceptorProvider;
    }

    @Override
    public void addInterceptors(InterceptorRegistry registry) {
        HibernateFilterInterceptor interceptor = interceptorProvider.getIfAvailable();
        if (interceptor != null) {
            // Après l'intercepteur open-in-view (ordre 0), qui ouvre la session de la requête.
            registry.addInterceptor(interceptor).order(Ordered.LOWEST_PRECEDENCE);
        }
        // Modules de l'agence (feature flags) : 403 avant d'entrer dans un contrôleur non inclus.
        RequiresFeatureInterceptor features = featureInterceptorProvider.getIfAvailable();
        if (features != null) {
            registry.addInterceptor(features);
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
