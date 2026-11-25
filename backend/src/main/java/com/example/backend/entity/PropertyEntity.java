package com.example.backend.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;
import org.hibernate.annotations.Filter;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

/**
 * Bien d'un propriétaire (cas d'usage n°1). Il appartient à l'organisation personnelle du
 * propriétaire ; ses annonces le référencent par {@code property_id}. L'adresse et le titre foncier
 * sont privés : aucun DTO public ne les expose.
 */
@Entity
@Table(name = "property")
@Filter(name = "orgIdFilter", condition = "org_id = :orgId")
@EntityListeners(AuditingEntityListener.class)
public class PropertyEntity extends BaseEntity {

    public static final String VERIFICATION_NONE = "NONE";

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "title", nullable = false, length = 255)
    private String title;

    @Column(name = "property_type", length = 40)
    private String propertyType;

    /** {@code SALE} ou {@code RENT}, comme le type d'annonce. */
    @Column(name = "transaction_type", nullable = false, length = 16)
    private String transactionType;

    @Column(name = "city", nullable = false, length = 120)
    private String city;

    @Column(name = "district", length = 120)
    private String district;

    @Column(name = "address", length = 500)
    private String address;

    @Column(name = "surface")
    private Double surface;

    @Column(name = "rooms")
    private Integer rooms;

    @Column(name = "expected_price", precision = 15, scale = 2)
    private BigDecimal expectedPrice;

    @Column(name = "currency", length = 3)
    private String currency;

    @Column(name = "description", length = 4000)
    private String description;

    @Column(name = "land_title_number", length = 64)
    private String landTitleNumber;

    @Column(name = "verification_status", nullable = false, length = 20)
    private String verificationStatus = VERIFICATION_NONE;

    public Long getId() {
        return id;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getPropertyType() {
        return propertyType;
    }

    public void setPropertyType(String propertyType) {
        this.propertyType = propertyType;
    }

    public String getTransactionType() {
        return transactionType;
    }

    public void setTransactionType(String transactionType) {
        this.transactionType = transactionType;
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

    public String getAddress() {
        return address;
    }

    public void setAddress(String address) {
        this.address = address;
    }

    public Double getSurface() {
        return surface;
    }

    public void setSurface(Double surface) {
        this.surface = surface;
    }

    public Integer getRooms() {
        return rooms;
    }

    public void setRooms(Integer rooms) {
        this.rooms = rooms;
    }

    public BigDecimal getExpectedPrice() {
        return expectedPrice;
    }

    public void setExpectedPrice(BigDecimal expectedPrice) {
        this.expectedPrice = expectedPrice;
    }

    public String getCurrency() {
        return currency;
    }

    public void setCurrency(String currency) {
        this.currency = currency;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public String getLandTitleNumber() {
        return landTitleNumber;
    }

    public void setLandTitleNumber(String landTitleNumber) {
        this.landTitleNumber = landTitleNumber;
    }

    public String getVerificationStatus() {
        return verificationStatus;
    }

    public void setVerificationStatus(String verificationStatus) {
        this.verificationStatus = verificationStatus;
    }
}
