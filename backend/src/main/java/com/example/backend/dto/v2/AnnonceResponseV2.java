package com.example.backend.dto.v2;

import com.example.backend.entity.enums.AnnonceStatus;
import com.example.backend.entity.enums.AnnonceType;
import io.swagger.v3.oas.annotations.media.Schema;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.Map;

@Schema(description = "Annonce response representation (API v2)")
public class AnnonceResponseV2 {

    @Schema(description = "Unique identifier", example = "1")
    private Long id;

    @Schema(description = "Organization ID", example = "org-123")
    private String orgId;

    @Schema(description = "Property title", example = "Beautiful Apartment")
    private String title;

    @Schema(description = "Property description")
    private String description;

    @Schema(description = "Property category", example = "Apartment")
    private String category;

    @Schema(description = "Property type", example = "SALE")
    private AnnonceType type;

    @Schema(description = "Location information")
    private LocationInfoV2 location;

    @Schema(description = "Property details")
    private PropertyDetailsV2 details;

    @Schema(description = "Pricing information")
    private PricingInfoV2 pricing;

    @Schema(description = "Current status", example = "PUBLISHED")
    private AnnonceStatus status;

    @Schema(description = "Photo URLs")
    private List<String> photos;

    @Schema(description = "Property rules as JSON")
    private Map<String, Object> rules;

    @Schema(description = "Additional metadata")
    private Map<String, Object> metadata;

    @Schema(description = "Audit information")
    private AuditInfoV2 audit;

    public static class LocationInfoV2 {
        @Schema(description = "Street address", example = "123 Main Street")
        private String address;

        @Schema(description = "City", example = "Paris")
        private String city;

        @Schema(description = "Postal code", example = "75001")
        private String postalCode;

        @Schema(description = "Country code", example = "FR")
        private String countryCode;

        public String getAddress() {
            return address;
        }

        public void setAddress(String address) {
            this.address = address;
        }

        public String getCity() {
            return city;
        }

        public void setCity(String city) {
            this.city = city;
        }

        public String getPostalCode() {
            return postalCode;
        }

        public void setPostalCode(String postalCode) {
            this.postalCode = postalCode;
        }

        public String getCountryCode() {
            return countryCode;
        }

        public void setCountryCode(String countryCode) {
            this.countryCode = countryCode;
        }
    }

    public static class PropertyDetailsV2 {
        @Schema(description = "Surface area in square meters", example = "85.5")
        private Double surface;

        @Schema(description = "Number of rooms", example = "4")
        private Integer rooms;

        @Schema(description = "Number of bedrooms", example = "3")
        private Integer bedrooms;

        @Schema(description = "Number of bathrooms", example = "2")
        private Integer bathrooms;

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

        public Integer getBedrooms() {
            return bedrooms;
        }

        public void setBedrooms(Integer bedrooms) {
            this.bedrooms = bedrooms;
        }

        public Integer getBathrooms() {
            return bathrooms;
        }

        public void setBathrooms(Integer bathrooms) {
            this.bathrooms = bathrooms;
        }
    }

    public static class PricingInfoV2 {
        @Schema(description = "Property price", example = "450000.00")
        private BigDecimal amount;

        @Schema(description = "Currency code", example = "EUR")
        private String currency;

        @Schema(description = "Price per square meter", example = "5263.16")
        private BigDecimal pricePerSqm;

        public BigDecimal getAmount() {
            return amount;
        }

        public void setAmount(BigDecimal amount) {
            this.amount = amount;
        }

        public String getCurrency() {
            return currency;
        }

        public void setCurrency(String currency) {
            this.currency = currency;
        }

        public BigDecimal getPricePerSqm() {
            return pricePerSqm;
        }

        public void setPricePerSqm(BigDecimal pricePerSqm) {
            this.pricePerSqm = pricePerSqm;
        }
    }

    public static class AuditInfoV2 {
        @Schema(description = "Timestamp when created (ISO-8601)", example = "2024-01-01T12:00:00Z")
        private Instant createdAt;

        @Schema(
                description = "Timestamp when last updated (ISO-8601)",
                example = "2024-01-01T12:00:00Z")
        private Instant updatedAt;

        @Schema(description = "User who created the resource")
        private String createdBy;

        @Schema(description = "User who last updated the resource")
        private String updatedBy;

        public Instant getCreatedAt() {
            return createdAt;
        }

        public void setCreatedAt(Instant createdAt) {
            this.createdAt = createdAt;
        }

        public Instant getUpdatedAt() {
            return updatedAt;
        }

        public void setUpdatedAt(Instant updatedAt) {
            this.updatedAt = updatedAt;
        }

        public String getCreatedBy() {
            return createdBy;
        }

        public void setCreatedBy(String createdBy) {
            this.createdBy = createdBy;
        }

        public String getUpdatedBy() {
            return updatedBy;
        }

        public void setUpdatedBy(String updatedBy) {
            this.updatedBy = updatedBy;
        }
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getOrgId() {
        return orgId;
    }

    public void setOrgId(String orgId) {
        this.orgId = orgId;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public String getCategory() {
        return category;
    }

    public void setCategory(String category) {
        this.category = category;
    }

    public AnnonceType getType() {
        return type;
    }

    public void setType(AnnonceType type) {
        this.type = type;
    }

    public LocationInfoV2 getLocation() {
        return location;
    }

    public void setLocation(LocationInfoV2 location) {
        this.location = location;
    }

    public PropertyDetailsV2 getDetails() {
        return details;
    }

    public void setDetails(PropertyDetailsV2 details) {
        this.details = details;
    }

    public PricingInfoV2 getPricing() {
        return pricing;
    }

    public void setPricing(PricingInfoV2 pricing) {
        this.pricing = pricing;
    }

    public AnnonceStatus getStatus() {
        return status;
    }

    public void setStatus(AnnonceStatus status) {
        this.status = status;
    }

    public List<String> getPhotos() {
        return photos;
    }

    public void setPhotos(List<String> photos) {
        this.photos = photos;
    }

    public Map<String, Object> getRules() {
        return rules;
    }

    public void setRules(Map<String, Object> rules) {
        this.rules = rules;
    }

    public Map<String, Object> getMetadata() {
        return metadata;
    }

    public void setMetadata(Map<String, Object> metadata) {
        this.metadata = metadata;
    }

    public AuditInfoV2 getAudit() {
        return audit;
    }

    public void setAudit(AuditInfoV2 audit) {
        this.audit = audit;
    }
}
