package com.example.backend.dto;

import jakarta.validation.constraints.NotBlank;

public class CreateProgramRequest {
    
    @NotBlank(message = "Name is required")
    private String name;
    
    private String description;
    private String location;
    private String city;
    private java.time.LocalDate deliveryDate;

    // Getters and Setters

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public String getLocation() {
        return location;
    }

    public void setLocation(String location) {
        this.location = location;
    }

    public String getCity() {
        return city;
    }

    public void setCity(String city) {
        this.city = city;
    }

    public java.time.LocalDate getDeliveryDate() {
        return deliveryDate;
    }

    public void setDeliveryDate(java.time.LocalDate deliveryDate) {
        this.deliveryDate = deliveryDate;
    }
}
