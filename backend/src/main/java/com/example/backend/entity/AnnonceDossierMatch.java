package com.example.backend.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.List;
import org.hibernate.annotations.Filter;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

/** Acheteur (dossier) dont les critères de recherche correspondent à une annonce. */
@Entity
@Table(name = "annonce_dossier_match")
@Filter(name = "orgIdFilter", condition = "org_id = :orgId")
@EntityListeners(AuditingEntityListener.class)
public class AnnonceDossierMatch extends BaseEntity {

    /** Nouvelle correspondance, pas encore vue par l'agent. */
    public static final String STATUS_NEW = "NEW";

    public static final String STATUS_SEEN = "SEEN";

    /** Écartée par l'agent : ne réapparaît pas aux calculs suivants. */
    public static final String STATUS_DISMISSED = "DISMISSED";

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id", updatable = false, nullable = false)
    private Long id;

    @Column(name = "annonce_id", nullable = false)
    private Long annonceId;

    @Column(name = "dossier_id", nullable = false)
    private Long dossierId;

    @Column(name = "score", nullable = false)
    private Integer score;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "reasons")
    private List<String> reasons;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "alerts")
    private List<String> alerts;

    @Column(name = "status", nullable = false, length = 20)
    private String status;

    @Column(name = "notified_at")
    private LocalDateTime notifiedAt;

    /** Date d'envoi de la proposition au client (null si jamais proposé). */
    @Column(name = "pitched_at")
    private LocalDateTime pitchedAt;

    @Column(name = "pitch_channel", length = 20)
    private String pitchChannel;

    /** Message sortant (outbound_message) de la dernière proposition. */
    @Column(name = "pitch_message_id")
    private Long pitchMessageId;

    /** Intention du client : VISITE, INTERESSE, NEGOCIATION, QUESTION, PAS_INTERESSE ou AUTRE. */
    @Column(name = "reply_intent", length = 30)
    private String replyIntent;

    /** Extrait de la réponse du client. */
    @Column(name = "reply_excerpt", length = 500)
    private String replyExcerpt;

    @Column(name = "reply_at")
    private LocalDateTime replyAt;

    /** Message entrant (message) analysé. */
    @Column(name = "reply_message_id")
    private Long replyMessageId;

    /** Créneau de visite proposé à l'agent (libre dans son agenda). */
    @Column(name = "proposed_start")
    private LocalDateTime proposedStart;

    @Column(name = "proposed_end")
    private LocalDateTime proposedEnd;

    /** Rendez-vous de visite créé depuis la proposition. */
    @Column(name = "visit_appointment_id")
    private Long visitAppointmentId;

    public String getReplyIntent() {
        return replyIntent;
    }

    public void setReplyIntent(String replyIntent) {
        this.replyIntent = replyIntent;
    }

    public String getReplyExcerpt() {
        return replyExcerpt;
    }

    public void setReplyExcerpt(String replyExcerpt) {
        this.replyExcerpt = replyExcerpt;
    }

    public LocalDateTime getReplyAt() {
        return replyAt;
    }

    public void setReplyAt(LocalDateTime replyAt) {
        this.replyAt = replyAt;
    }

    public Long getReplyMessageId() {
        return replyMessageId;
    }

    public void setReplyMessageId(Long replyMessageId) {
        this.replyMessageId = replyMessageId;
    }

    public LocalDateTime getProposedStart() {
        return proposedStart;
    }

    public void setProposedStart(LocalDateTime proposedStart) {
        this.proposedStart = proposedStart;
    }

    public LocalDateTime getProposedEnd() {
        return proposedEnd;
    }

    public void setProposedEnd(LocalDateTime proposedEnd) {
        this.proposedEnd = proposedEnd;
    }

    public Long getVisitAppointmentId() {
        return visitAppointmentId;
    }

    public void setVisitAppointmentId(Long visitAppointmentId) {
        this.visitAppointmentId = visitAppointmentId;
    }

    public LocalDateTime getPitchedAt() {
        return pitchedAt;
    }

    public void setPitchedAt(LocalDateTime pitchedAt) {
        this.pitchedAt = pitchedAt;
    }

    public String getPitchChannel() {
        return pitchChannel;
    }

    public void setPitchChannel(String pitchChannel) {
        this.pitchChannel = pitchChannel;
    }

    public Long getPitchMessageId() {
        return pitchMessageId;
    }

    public void setPitchMessageId(Long pitchMessageId) {
        this.pitchMessageId = pitchMessageId;
    }

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

    public Long getDossierId() {
        return dossierId;
    }

    public void setDossierId(Long dossierId) {
        this.dossierId = dossierId;
    }

    public Integer getScore() {
        return score;
    }

    public void setScore(Integer score) {
        this.score = score;
    }

    public List<String> getReasons() {
        return reasons;
    }

    public void setReasons(List<String> reasons) {
        this.reasons = reasons;
    }

    public List<String> getAlerts() {
        return alerts;
    }

    public void setAlerts(List<String> alerts) {
        this.alerts = alerts;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public LocalDateTime getNotifiedAt() {
        return notifiedAt;
    }

    public void setNotifiedAt(LocalDateTime notifiedAt) {
        this.notifiedAt = notifiedAt;
    }
}
