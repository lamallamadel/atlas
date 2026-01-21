package com.example.backend.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.io.*;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.UUID;

@Component("localFileStorage")
public class LocalFileStorageStrategy implements FileStorageStrategy {

    private static final Logger logger = LoggerFactory.getLogger(LocalFileStorageStrategy.class);

    @Value("${storage.local.base-path:./storage}")
    private String basePath;

    @Override
    public String store(String orgId, Long dossierId, String fileName, InputStream inputStream, long size, String contentType) {
        try {
            String sanitizedFileName = sanitizeFileName(fileName);
            String uniqueFileName = UUID.randomUUID().toString() + "_" + sanitizedFileName;
            String relativePath = buildPath(orgId, dossierId, uniqueFileName);
            Path fullPath = Paths.get(basePath, relativePath);

            Files.createDirectories(fullPath.getParent());

            Files.copy(inputStream, fullPath, StandardCopyOption.REPLACE_EXISTING);

            logger.info("File stored successfully at: {}", relativePath);
            return relativePath;
        } catch (IOException e) {
            logger.error("Failed to store file: {}", fileName, e);
            throw new RuntimeException("Failed to store file: " + fileName, e);
        }
    }

    @Override
    public InputStream retrieve(String storagePath) {
        try {
            Path fullPath = Paths.get(basePath, storagePath);
            if (!Files.exists(fullPath)) {
                throw new FileNotFoundException("File not found: " + storagePath);
            }
            return Files.newInputStream(fullPath);
        } catch (IOException e) {
            logger.error("Failed to retrieve file: {}", storagePath, e);
            throw new RuntimeException("Failed to retrieve file: " + storagePath, e);
        }
    }

    @Override
    public void delete(String storagePath) {
        try {
            Path fullPath = Paths.get(basePath, storagePath);
            if (Files.exists(fullPath)) {
                Files.delete(fullPath);
                logger.info("File deleted successfully: {}", storagePath);
            }
        } catch (IOException e) {
            logger.error("Failed to delete file: {}", storagePath, e);
            throw new RuntimeException("Failed to delete file: " + storagePath, e);
        }
    }

    @Override
    public boolean exists(String storagePath) {
        Path fullPath = Paths.get(basePath, storagePath);
        return Files.exists(fullPath);
    }

    private String buildPath(String orgId, Long dossierId, String fileName) {
        return String.format("%s/dossiers/%d/%s", orgId, dossierId, fileName);
    }

    private String sanitizeFileName(String fileName) {
        return fileName.replaceAll("[^a-zA-Z0-9._-]", "_");
    }
}
