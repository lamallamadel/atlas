package com.example.backend.service;

import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.util.UUID;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import software.amazon.awssdk.auth.credentials.AwsBasicCredentials;
import software.amazon.awssdk.auth.credentials.StaticCredentialsProvider;
import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.*;

@Component("s3FileStorage")
public class S3FileStorageStrategy implements FileStorageStrategy {

    private static final Logger logger = LoggerFactory.getLogger(S3FileStorageStrategy.class);

    @Value("${storage.s3.bucket-name:}")
    private String bucketName;

    @Value("${storage.s3.region:us-east-1}")
    private String region;

    @Value("${storage.s3.access-key:}")
    private String accessKey;

    @Value("${storage.s3.secret-key:}")
    private String secretKey;

    private S3Client s3Client;

    private S3Client getS3Client() {
        if (s3Client == null) {
            if (accessKey != null
                    && !accessKey.isEmpty()
                    && secretKey != null
                    && !secretKey.isEmpty()) {
                AwsBasicCredentials credentials = AwsBasicCredentials.create(accessKey, secretKey);
                s3Client =
                        S3Client.builder()
                                .region(Region.of(region))
                                .credentialsProvider(StaticCredentialsProvider.create(credentials))
                                .build();
            } else {
                s3Client = S3Client.builder().region(Region.of(region)).build();
            }
        }
        return s3Client;
    }

    @Override
    public String store(
            String orgId,
            Long dossierId,
            String fileName,
            InputStream inputStream,
            long size,
            String contentType) {
        try {
            String sanitizedFileName = sanitizeFileName(fileName);
            String uniqueFileName = UUID.randomUUID().toString() + "_" + sanitizedFileName;
            String s3Key = buildPath(orgId, dossierId, uniqueFileName);

            byte[] bytes = inputStream.readAllBytes();

            PutObjectRequest putObjectRequest =
                    PutObjectRequest.builder()
                            .bucket(bucketName)
                            .key(s3Key)
                            .contentType(contentType)
                            .contentLength((long) bytes.length)
                            .build();

            getS3Client().putObject(putObjectRequest, RequestBody.fromBytes(bytes));

            logger.info("File stored successfully in S3 at: {}", s3Key);
            return s3Key;
        } catch (IOException e) {
            logger.error("Failed to store file in S3: {}", fileName, e);
            throw new RuntimeException("Failed to store file in S3: " + fileName, e);
        } catch (S3Exception e) {
            logger.error("S3 error while storing file: {}", fileName, e);
            throw new RuntimeException("S3 error while storing file: " + fileName, e);
        }
    }

    @Override
    public InputStream retrieve(String storagePath) {
        try {
            GetObjectRequest getObjectRequest =
                    GetObjectRequest.builder().bucket(bucketName).key(storagePath).build();

            byte[] bytes = getS3Client().getObjectAsBytes(getObjectRequest).asByteArray();
            return new ByteArrayInputStream(bytes);
        } catch (S3Exception e) {
            logger.error("Failed to retrieve file from S3: {}", storagePath, e);
            throw new RuntimeException("Failed to retrieve file from S3: " + storagePath, e);
        }
    }

    @Override
    public void delete(String storagePath) {
        try {
            DeleteObjectRequest deleteObjectRequest =
                    DeleteObjectRequest.builder().bucket(bucketName).key(storagePath).build();

            getS3Client().deleteObject(deleteObjectRequest);
            logger.info("File deleted successfully from S3: {}", storagePath);
        } catch (S3Exception e) {
            logger.error("Failed to delete file from S3: {}", storagePath, e);
            throw new RuntimeException("Failed to delete file from S3: " + storagePath, e);
        }
    }

    @Override
    public boolean exists(String storagePath) {
        try {
            HeadObjectRequest headObjectRequest =
                    HeadObjectRequest.builder().bucket(bucketName).key(storagePath).build();

            getS3Client().headObject(headObjectRequest);
            return true;
        } catch (NoSuchKeyException e) {
            return false;
        } catch (S3Exception e) {
            logger.error("Error checking if file exists in S3: {}", storagePath, e);
            return false;
        }
    }

    private String buildPath(String orgId, Long dossierId, String fileName) {
        return String.format("%s/dossiers/%d/%s", orgId, dossierId, fileName);
    }

    private String sanitizeFileName(String fileName) {
        return fileName.replaceAll("[^a-zA-Z0-9._-]", "_");
    }
}
