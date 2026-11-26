package com.example.backend.entity;

import jakarta.persistence.*;
import org.hibernate.annotations.Filter;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

/**
 * Zone d'intervention d'une agence : une ville, éventuellement un quartier (cas d'usage n°1, lot
 * B).
 */
@Entity
@Table(name = "agency_zone")
@Filter(name = "orgIdFilter", condition = "org_id = :orgId")
@EntityListeners(AuditingEntityListener.class)
public class AgencyZoneEntity extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "city", nullable = false, length = 120)
    private String city;

    @Column(name = "district", length = 120)
    private String district;

    public Long getId() {
        return id;
    }

    public String getCity() {
        return city;
    }

    public void setCity(String city) {
        this.city = city;
    }

    public String getDistrict() {
        return district;
    }

    public void setDistrict(String district) {
        this.district = district;
    }
}
