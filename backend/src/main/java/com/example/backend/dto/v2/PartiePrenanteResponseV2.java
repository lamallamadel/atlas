package com.example.backend.dto.v2;

import com.example.backend.entity.enums.PartiePrenanteRole;
import io.swagger.v3.oas.annotations.media.Schema;
import java.time.Instant;

@Schema(description = "Partie prenante response representation (API v2)")
public class PartiePrenanteResponseV2 {

    @Schema(description = "Unique identifier", example = "1")
    private Long id;

    @Schema(description = "Role of the party", example = "BUYER")
    private PartiePrenanteRole role;

    @Schema(description = "Full name", example = "John Doe")
    private String name;

    @Schema(description = "First name", example = "John")
    private String firstName;

    @Schema(description = "Last name", example = "Doe")
    private String lastName;

    @Schema(description = "Email address", example = "john.doe@example.com")
    private String email;

    @Schema(description = "Phone number", example = "+33612345678")
    private String phone;

    @Schema(description = "Company name", example = "Acme Corp")
    private String company;

    @Schema(description = "Whether party has given consent for data processing")
    private Boolean hasConsent;

    @Schema(description = "Timestamp when created (ISO-8601)", example = "2024-01-01T12:00:00Z")
    private Instant createdAt;

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public PartiePrenanteRole getRole() {
        return role;
    }

    public void setRole(PartiePrenanteRole role) {
        this.role = role;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getFirstName() {
        return firstName;
    }

    public void setFirstName(String firstName) {
        this.firstName = firstName;
    }

    public String getLastName() {
        return lastName;
    }

    public void setLastName(String lastName) {
        this.lastName = lastName;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getPhone() {
        return phone;
    }

    public void setPhone(String phone) {
        this.phone = phone;
    }

    public String getCompany() {
        return company;
    }

    public void setCompany(String company) {
        this.company = company;
    }

    public Boolean getHasConsent() {
        return hasConsent;
    }

    public void setHasConsent(Boolean hasConsent) {
        this.hasConsent = hasConsent;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }
}
