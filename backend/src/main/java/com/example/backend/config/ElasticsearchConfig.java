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
        String hosts = elasticsearchUris.replace("http://", "").replace("https://", "");
        ClientConfiguration.MaybeSecureClientConfigurationBuilder base =
                ClientConfiguration.builder().connectedTo(hosts);

        if (username != null && !username.isEmpty()) {
            return base.withBasicAuth(username, password)
                    .withConnectTimeout(Duration.ofSeconds(10))
                    .withSocketTimeout(Duration.ofSeconds(30))
                    .build();
        }

        return base.withConnectTimeout(Duration.ofSeconds(10))
                .withSocketTimeout(Duration.ofSeconds(30))
                .build();
    }
}
