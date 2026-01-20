package com.example.backend.service;

import java.io.InputStream;

public interface FileStorageStrategy {

    String store(String orgId, Long dossierId, String fileName, InputStream inputStream, long size, String contentType);

    InputStream retrieve(String storagePath);

    void delete(String storagePath);

    boolean exists(String storagePath);
}
