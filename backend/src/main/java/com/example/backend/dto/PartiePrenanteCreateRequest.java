package com.example.backend.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import java.util.Map;

@Schema(description = "Request body for creating a partie prenante")
public class PartiePrenanteCreateRequest {

    @Schema(description = "Dossier ID", example = "1", required = true)
    @NotNull(message = "Dossier ID is required")
    private Long dossierId;

    @Schema(description = "Role of the partie prenante", example = "BUYER", required = true)
    @NotBlank(message = "Role is required")
    private String role;

    @Schema(description = "Full name", example = "John Doe", nullable = true)
    @Size(max = 255, message = "Name must not exceed 255 characters")
    private String name;

    @Schema(description = "First name", example = "John", nullable = true)
    @Size(max = 255, message = "First name must not exceed 255 characters")
    private String firstName;

    @Schema(description = "Last name", example = "Doe", nullable = true)
    @Size(max = 255, message = "Last name must not exceed 255 characters")
    private String lastName;

    @Schema(description = "Email address", example = "john.doe@example.com", nullable = true)
    @Email(message = "Email must be valid")
    @Size(max = 255, message = "Email must not exceed 255 characters")
    private String email;

    @Schema(description = "Phone number", example = "+33612345678", nullable = true)
    @Pattern(regexp = "^\\+?[0-9\\s\\-()]{0,50}$", message = "Phone must be a valid format")
    @Size(max = 50, message = "Phone must not exceed 50 characters")
    private String phone;

    @Schema(description = "Address", example = "123 Main St, Paris, 75001", nullable = true)
    @Size(max = 500, message = "Address must not exceed 500 characters")
    private String address;

    @Schema(description = "Metadata", example = "{\"key\": \"value\"}")
    private Map<String, Object> meta;

    public PartiePrenanteCreateRequest() {}

    public Long getDossierId() {
        return dossierId;
    }

    public void setDossierId(Long dossierId) {
        this.dossierId = dossierId;
    }

    public String getRole() {
        return role;
    }

    public void setRole(String role) {
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
}
