package com.example.backend.dto;

import com.example.backend.entity.enums.AnnonceStatus;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;

public class AnnonceUpdateRequest {

    @Size(max = 500, message = "Title must not exceed 500 characters")
    private String title;

    @Size(max = 10000, message = "Description must not exceed 10000 characters")
    private String description;

    @Size(max = 100, message = "Category must not exceed 100 characters")
    private String category;

    @Size(max = 255, message = "City must not exceed 255 characters")
    private String city;

    @DecimalMin(value = "0.0", inclusive = true, message = "Price must be greater than or equal to 0")
    private BigDecimal price;

    @Size(max = 3, message = "Currency must not exceed 3 characters")
    private String currency;

    private AnnonceStatus status;

    public AnnonceUpdateRequest() {
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

    public String getCity() {
        return city;
    }

    public void setCity(String city) {
        this.city = city;
    }

    public BigDecimal getPrice() {
        return price;
    }

    public void setPrice(BigDecimal price) {
        this.price = price;
    }

    public String getCurrency() {
        return currency;
    }

    public void setCurrency(String currency) {
        this.currency = currency;
    }

    public AnnonceStatus getStatus() {
        return status;
    }

    public void setStatus(AnnonceStatus status) {
        this.status = status;
    }
}
