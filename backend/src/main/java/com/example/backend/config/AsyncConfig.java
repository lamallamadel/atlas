package com.example.backend.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;
import org.springframework.scheduling.annotation.EnableAsync;

@Configuration
@EnableAsync
@Profile("!backend-e2e & !test")
public class AsyncConfig {
}
