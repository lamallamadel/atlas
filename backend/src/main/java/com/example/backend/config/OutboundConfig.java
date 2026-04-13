package com.example.backend.config;

import java.time.Duration;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.web.client.RestTemplate;

@Configuration
public class OutboundConfig {

    @Bean
    public RestTemplate restTemplate() {
        return createRestTemplate(Duration.ofSeconds(10), Duration.ofSeconds(30));
    }

    @Bean("brainRestTemplate")
    public RestTemplate brainRestTemplate() {
        return createRestTemplate(Duration.ofSeconds(5), Duration.ofSeconds(30));
    }

    private RestTemplate createRestTemplate(Duration connectTimeout, Duration readTimeout) {
        SimpleClientHttpRequestFactory requestFactory = new SimpleClientHttpRequestFactory();
        requestFactory.setConnectTimeout(connectTimeout);
        requestFactory.setReadTimeout(readTimeout);
        return new RestTemplate(requestFactory);
    }
}
