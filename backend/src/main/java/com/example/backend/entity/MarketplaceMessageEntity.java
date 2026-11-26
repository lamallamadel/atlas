package com.example.backend.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

/**
 * Message entre un propriétaire et une agence sur une proposition. Stocké tel quel ; masqué à la
 * lecture tant que la proposition n'est pas acceptée (R-PROP-08).
 */
@Entity
@Table(name = "marketplace_message")
public class MarketplaceMessageEntity {

    public static final String OWNER = "OWNER";
    public static final String AGENCY = "AGENCY";

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "proposal_id", nullable = false, updatable = false)
    private Long proposalId;

    @Column(name = "author_side", nullable = false, length = 8)
    private String authorSide;

    @Column(name = "author_user_id")
    private String authorUserId;

    @Column(name = "author_name")
    private String authorName;

    @Column(name = "body", nullable = false, length = 4000)
    private String body;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    public Long getId() {
        return id;
    }

    public Long getProposalId() {
        return proposalId;
    }

    public void setProposalId(Long proposalId) {
        this.proposalId = proposalId;
    }

    public String getAuthorSide() {
        return authorSide;
    }

    public void setAuthorSide(String authorSide) {
        this.authorSide = authorSide;
    }

    public String getAuthorUserId() {
        return authorUserId;
    }

    public void setAuthorUserId(String authorUserId) {
        this.authorUserId = authorUserId;
    }

    public String getAuthorName() {
        return authorName;
    }

    public void setAuthorName(String authorName) {
        this.authorName = authorName;
    }

    public String getBody() {
        return body;
    }

    public void setBody(String body) {
        this.body = body;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
}
