package com.example.backend.config;

import io.swagger.v3.oas.models.Components;
import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.info.License;
import io.swagger.v3.oas.models.security.SecurityScheme;
import io.swagger.v3.oas.models.servers.Server;
import java.util.List;
import org.springdoc.core.models.GroupedOpenApi;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class OpenApiConfig {

    @Bean
    public OpenAPI customOpenAPI() {
        return new OpenAPI()
                .info(
                        new Info()
                                .title("Backend API Documentation")
                                .version("2.0.0")
                                .description(
                                        "API for managing real estate listings, leads, and workflows. "
                                                + "This documentation covers both v1 (deprecated) and v2 (current) API versions.")
                                .contact(
                                        new Contact()
                                                .name("API Support")
                                                .email("support@example.com"))
                                .license(
                                        new License()
                                                .name("Apache 2.0")
                                                .url(
                                                        "https://www.apache.org/licenses/LICENSE-2.0.html")))
                .servers(
                        List.of(
                                new Server()
                                        .url("http://localhost:8080")
                                        .description("Local development"),
                                new Server()
                                        .url("https://api.example.com")
                                        .description("Production")))
                .components(
                        new Components()
                                .addSecuritySchemes(
                                        "apiKey",
                                        new SecurityScheme()
                                                .type(SecurityScheme.Type.APIKEY)
                                                .in(SecurityScheme.In.HEADER)
                                                .name("X-API-Key")
                                                .description(
                                                        "API Key for accessing public endpoints"))
                                .addSecuritySchemes(
                                        "bearer",
                                        new SecurityScheme()
                                                .type(SecurityScheme.Type.HTTP)
                                                .scheme("bearer")
                                                .bearerFormat("JWT")
                                                .description(
                                                        "JWT token for authenticated endpoints")));
    }

    @Bean
    public GroupedOpenApi publicApiV1() {
        return GroupedOpenApi.builder()
                .group("v1-deprecated")
                .pathsToMatch("/api/v1/**")
                .displayName("API v1 (Deprecated)")
                .build();
    }

    @Bean
    public GroupedOpenApi publicApiV2() {
        return GroupedOpenApi.builder()
                .group("v2-current")
                .pathsToMatch("/api/v2/**")
                .displayName("API v2 (Current)")
                .build();
    }

    @Bean
    public GroupedOpenApi publicApiPublic() {
        return GroupedOpenApi.builder()
                .group("public-api")
                .pathsToMatch("/api/public/v1/**")
                .displayName("Public API (Third-Party)")
                .build();
    }

    @Bean
    public GroupedOpenApi developerPortal() {
        return GroupedOpenApi.builder()
                .group("developer-portal")
                .pathsToMatch("/api/v1/developer/**")
                .displayName("Developer Portal")
                .build();
    }

    @Bean
    public GroupedOpenApi allApis() {
        return GroupedOpenApi.builder()
                .group("all")
                .pathsToMatch("/api/**")
                .displayName("All APIs")
                .build();
    }
}
