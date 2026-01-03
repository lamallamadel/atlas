package com.example.backend.dto;

import com.example.backend.entity.enums.AnnonceType;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

public class AnnonceCreateRequest {

    @NotBlank(message = "Title is required")
    @Size(max = 500, message = "Title must not exceed 500 characters")
    private String title;

    @Size(max = 10000, message = "Description must not exceed 10000 characters")
    private String description;

    @Size(max = 100, message = "Category must not exceed 100 characters")
    private String category;

    private AnnonceType type;

    @Size(max = 500, message = "Address must not exceed 500 characters")
    private String address;

    @DecimalMin(value = "0.0", inclusive = true, message = "Surface must be greater than or equal to 0")
    private Double surface;

    @Size(max = 255, message = "City must not exceed 255 characters")
    private String city;

    @DecimalMin(value = "0.0", inclusive = true, message = "Price must be greater than or equal to 0")
    private BigDecimal price;

    @Size(max = 3, message = "Currency must not exceed 3 characters")
    private String currency;

    private List<String> photos;

    private Map<String, Object> rulesJson;

    private Map<String, Object> meta;

    public AnnonceCreateRequest() {
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

    public List<String> getPhotos() {
        return photos;
    }

    public void setPhotos(List<String> photos) {
        this.photos = photos;
    }

    public Map<String, Object> getMeta() {
        return meta;
    }

    public void setMeta(Map<String, Object> meta) {
        this.meta = meta;
    }

    public Map<String, Object> getRulesJson() {
        return rulesJson;
    }

    public void setRulesJson(Map<String, Object> rulesJson) {
        this.rulesJson = rulesJson;
    }
}
