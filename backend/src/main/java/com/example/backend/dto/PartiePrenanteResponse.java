package com.example.backend.dto;

import com.example.backend.entity.enums.PartiePrenanteRole;
import io.swagger.v3.oas.annotations.media.Schema;
import java.time.LocalDateTime;
import java.util.Map;

@Schema(description = "Partie prenante response representation")
public class PartiePrenanteResponse {

    @Schema(description = "Unique identifier", example = "1")
    private Long id;

    @Schema(description = "Dossier ID", example = "1")
    private Long dossierId;

    @Schema(description = "Role of the partie prenante", example = "BUYER")
    private PartiePrenanteRole role;

    @Schema(description = "Full name", example = "John Doe", nullable = true)
    private String name;

    @Schema(description = "First name", example = "John", nullable = true)
    private String firstName;

    @Schema(description = "Last name", example = "Doe", nullable = true)
    private String lastName;

    @Schema(description = "Email address", example = "john.doe@example.com", nullable = true)
    private String email;

    @Schema(description = "Phone number", example = "+33612345678", nullable = true)
    private String phone;

    @Schema(description = "Address", example = "123 Main St, Paris, 75001", nullable = true)
    private String address;

    @Schema(description = "Metadata", example = "{\"key\": \"value\"}")
    private Map<String, Object> meta;

    @Schema(description = "Timestamp when created", example = "2024-01-01T12:00:00")
    private LocalDateTime createdAt;

    @Schema(description = "Timestamp when last updated", example = "2024-01-01T12:00:00")
    private LocalDateTime updatedAt;

    public PartiePrenanteResponse() {}

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Long getDossierId() {
        return dossierId;
    }

    public void setDossierId(Long dossierId) {
        this.dossierId = dossierId;
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

    public String getAddress() {
        return address;
    }

    public void setAddress(String address) {
        this.address = address;
    }

    public Map<String, Object> getMeta() {
        return meta;
    }

    public void setMeta(Map<String, Object> meta) {
        this.meta = meta;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(LocalDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }
}
