package com.example.backend.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.Map;
import org.hibernate.annotations.DynamicUpdate;
import org.hibernate.annotations.Filter;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

/**
 * Photo (ou vidéo) d'une annonce. Soit importée dans Atlas ({@link #SOURCE_UPLOAD}, fichier dans le
 * stockage), soit simple lien externe ({@link #SOURCE_URL}, venant de l'ancien champ photos). Porte
 * aussi le résultat de son analyse visuelle par le brain.
 */
@Entity
@Table(name = "annonce_media")
@Filter(name = "orgIdFilter", condition = "org_id = :orgId")
@EntityListeners(AuditingEntityListener.class)
@DynamicUpdate
public class AnnonceMedia extends BaseEntity {

    public static final String TYPE_PHOTO = "PHOTO";
    public static final String SOURCE_UPLOAD = "UPLOAD";
    public static final String SOURCE_URL = "URL";

    /** Pas encore analysée, ou réanalyse demandée. */
    public static final String STATUS_PENDING = "PENDING";

    public static final String STATUS_DONE = "DONE";

    /** Échec technique : sera retentée à la prochaine demande d'analyse. */
    public static final String STATUS_FAILED = "FAILED";

    /**
     * Refusée par le moteur (format, source non prise en charge…) : inutile de réessayer tel quel.
     */
    public static final String STATUS_REJECTED = "REJECTED";

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id", updatable = false, nullable = false)
    private Long id;

    @Column(name = "annonce_id", nullable = false)
    private Long annonceId;

    @Column(name = "media_type", nullable = false, length = 20)
    private String mediaType;

    @Column(name = "source", nullable = false, length = 20)
    private String source;

    @Column(name = "storage_path", length = 1000)
    private String storagePath;

    @Column(name = "external_url", length = 1000)
    private String externalUrl;

    @Column(name = "file_name", length = 255)
    private String fileName;

    @Column(name = "content_type", length = 100)
    private String contentType;

    @Column(name = "file_size")
    private Long fileSize;

    @Column(name = "position", nullable = false)
    private Integer position;

    @Column(name = "analysis_status", nullable = false, length = 20)
    private String analysisStatus;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "analysis")
    private Map<String, Object> analysis;

    @Column(name = "analysis_engine", length = 20)
    private String analysisEngine;

    @Column(name = "analysis_error", length = 500)
    private String analysisError;

    @Column(name = "analyzed_at")
    private LocalDateTime analyzedAt;

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Long getAnnonceId() {
        return annonceId;
    }

    public void setAnnonceId(Long annonceId) {
        this.annonceId = annonceId;
    }

    public String getMediaType() {
        return mediaType;
    }

    public void setMediaType(String mediaType) {
        this.mediaType = mediaType;
    }

    public String getSource() {
        return source;
    }

    public void setSource(String source) {
        this.source = source;
    }

    public String getStoragePath() {
        return storagePath;
    }

    public void setStoragePath(String storagePath) {
        this.storagePath = storagePath;
    }

    public String getExternalUrl() {
        return externalUrl;
    }

    public void setExternalUrl(String externalUrl) {
        this.externalUrl = externalUrl;
    }

    public String getFileName() {
        return fileName;
    }

    public void setFileName(String fileName) {
        this.fileName = fileName;
    }

    public String getContentType() {
        return contentType;
    }

    public void setContentType(String contentType) {
        this.contentType = contentType;
    }

    public Long getFileSize() {
        return fileSize;
    }

    public void setFileSize(Long fileSize) {
        this.fileSize = fileSize;
    }

    public Integer getPosition() {
        return position;
    }

    public void setPosition(Integer position) {
        this.position = position;
    }

    public String getAnalysisStatus() {
        return analysisStatus;
    }

    public void setAnalysisStatus(String analysisStatus) {
        this.analysisStatus = analysisStatus;
    }

    public Map<String, Object> getAnalysis() {
        return analysis;
    }

    public void setAnalysis(Map<String, Object> analysis) {
        this.analysis = analysis;
    }

    public String getAnalysisEngine() {
        return analysisEngine;
    }

    public void setAnalysisEngine(String analysisEngine) {
        this.analysisEngine = analysisEngine;
    }

    public String getAnalysisError() {
        return analysisError;
    }

    public void setAnalysisError(String analysisError) {
        this.analysisError = analysisError;
    }

    public LocalDateTime getAnalyzedAt() {
        return analyzedAt;
    }

    public void setAnalyzedAt(LocalDateTime analyzedAt) {
        this.analyzedAt = analyzedAt;
    }
}
