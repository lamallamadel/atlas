package com.example.backend.entity;

import jakarta.persistence.*;
import org.hibernate.annotations.Filter;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

/**
 * Profil public d'une agence (cas d'usage n°1, lot B) : nom, présentation, langues, spécialités.
 */
@Entity
@Table(name = "agency_profile")
@Filter(name = "orgIdFilter", condition = "org_id = :orgId")
@EntityListeners(AuditingEntityListener.class)
public class AgencyProfileEntity extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "display_name", nullable = false, length = 255)
    private String displayName;

    @Column(name = "description", length = 2000)
    private String description;

    @Column(name = "languages", length = 255)
    private String languages;

    @Column(name = "property_types", length = 500)
    private String propertyTypes;

    @Column(name = "transactions", length = 32)
    private String transactions;

    public Long getId() {
        return id;
    }

    public String getDisplayName() {
        return displayName;
    }

    public void setDisplayName(String displayName) {
        this.displayName = displayName;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public String getLanguages() {
        return languages;
    }

    public void setLanguages(String languages) {
        this.languages = languages;
    }

    public String getPropertyTypes() {
        return propertyTypes;
    }

    public void setPropertyTypes(String propertyTypes) {
        this.propertyTypes = propertyTypes;
    }

    public String getTransactions() {
        return transactions;
    }

    public void setTransactions(String transactions) {
        this.transactions = transactions;
    }
}
