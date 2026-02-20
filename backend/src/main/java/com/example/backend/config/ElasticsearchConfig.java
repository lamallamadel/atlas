package com.example.backend.config;

import java.time.Duration;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.elasticsearch.client.ClientConfiguration;
import org.springframework.data.elasticsearch.client.elc.ElasticsearchConfiguration;
import org.springframework.data.elasticsearch.repository.config.EnableElasticsearchRepositories;

@Configuration
@EnableElasticsearchRepositories(basePackages = "com.example.backend.repository.search")
@ConditionalOnProperty(name = "elasticsearch.enabled", havingValue = "true", matchIfMissing = false)
public class ElasticsearchConfig extends ElasticsearchConfiguration {

    @Value("${elasticsearch.uris:http://localhost:9200}")
    private String elasticsearchUris;

    @Value("${elasticsearch.username:}")
    private String username;

    @Value("${elasticsearch.password:}")
    private String password;

    @Override
    public ClientConfiguration clientConfiguration() {
        ClientConfiguration.MaybeSecureClientConfigurationBuilder builder =
                ClientConfiguration.builder()
                        .connectedTo(
                                elasticsearchUris.replace("http://", "").replace("https://", ""))
                        .withConnectTimeout(Duration.ofSeconds(10))
                        .withSocketTimeout(Duration.ofSeconds(30));

        if (username != null && !username.isEmpty()) {
            builder.withBasicAuth(username, password);
        }

        return builder.build();
    }
}
