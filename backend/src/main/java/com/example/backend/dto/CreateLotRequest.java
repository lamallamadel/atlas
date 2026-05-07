package com.example.backend.dto;

import com.example.backend.entity.enums.LotType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;

public class CreateLotRequest {

    @NotBlank(message = "Lot number is required")
    private String lotNumber;

    @NotNull(message = "Type is required")
    private LotType type;

    private BigDecimal surface;
    private Integer floorNumber;
    private Integer bedrooms;
    private Integer bathrooms;

    @NotNull(message = "Price is required")
    private BigDecimal price;

    private String planImageUrl;
    private String virtualTourUrl;

    // Getters and Setters

    public String getLotNumber() {
        return lotNumber;
    }

    public void setLotNumber(String lotNumber) {
        this.lotNumber = lotNumber;
    }

    public LotType getType() {
        return type;
    }

    public void setType(LotType type) {
        this.type = type;
    }

    public BigDecimal getSurface() {
        return surface;
    }

    public void setSurface(BigDecimal surface) {
        this.surface = surface;
    }

    public Integer getFloorNumber() {
        return floorNumber;
    }

    public void setFloorNumber(Integer floorNumber) {
        this.floorNumber = floorNumber;
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

    public BigDecimal getPrice() {
        return price;
    }

    public void setPrice(BigDecimal price) {
        this.price = price;
    }

    public String getPlanImageUrl() {
        return planImageUrl;
    }

    public void setPlanImageUrl(String planImageUrl) {
        this.planImageUrl = planImageUrl;
    }

    public String getVirtualTourUrl() {
        return virtualTourUrl;
    }

    public void setVirtualTourUrl(String virtualTourUrl) {
        this.virtualTourUrl = virtualTourUrl;
    }
}
