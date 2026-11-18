package com.example.backend.service;

import java.io.InputStream;

public interface FileStorageStrategy {

    String store(
            String orgId,
            Long dossierId,
            String fileName,
            InputStream inputStream,
            long size,
            String contentType);

    /**
     * Stocke un fichier sous {@code orgId/folder/}. {@link #store} range sous {@code
     * orgId/dossiers/{dossierId}/}.
     */
    String storeInFolder(
            String orgId,
            String folder,
            String fileName,
            InputStream inputStream,
            long size,
            String contentType);

    InputStream retrieve(String storagePath);

    void delete(String storagePath);

    boolean exists(String storagePath);
}
