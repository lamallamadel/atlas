package com.example.backend.config;

import com.example.backend.service.FileStorageStrategy;
import com.example.backend.service.LocalFileStorageStrategy;
import com.example.backend.service.S3FileStorageStrategy;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class StorageConfig {

    @Value("${storage.strategy:localFileStorage}")
    private String storageStrategy;

    @Bean
    public FileStorageStrategy fileStorageStrategy(
            LocalFileStorageStrategy localFileStorageStrategy,
            S3FileStorageStrategy s3FileStorageStrategy) {
        
        if ("s3FileStorage".equals(storageStrategy)) {
            return s3FileStorageStrategy;
        }
        return localFileStorageStrategy;
    }
}
