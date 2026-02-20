package com.example.backend.brain.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import java.math.BigDecimal;

public class ContractGenerateRequest {
    @JsonProperty("dossier_id")
    private Long dossierId;

    @JsonProperty("buyer_name")
    private String buyerName;

    @JsonProperty("seller_name")
    private String sellerName;

    @JsonProperty("property_address")
    private String propertyAddress;

    @JsonProperty("agreed_price")
    private BigDecimal agreedPrice;

    public Long getDossierId() {
        return dossierId;
    }

    public void setDossierId(Long dossierId) {
        this.dossierId = dossierId;
    }

    public String getBuyerName() {
        return buyerName;
    }

    public void setBuyerName(String buyerName) {
        this.buyerName = buyerName;
    }

    public String getSellerName() {
        return sellerName;
    }

    public void setSellerName(String sellerName) {
        this.sellerName = sellerName;
    }

    public String getPropertyAddress() {
        return propertyAddress;
    }

    public void setPropertyAddress(String propertyAddress) {
        this.propertyAddress = propertyAddress;
    }

    public BigDecimal getAgreedPrice() {
        return agreedPrice;
    }

    public void setAgreedPrice(BigDecimal agreedPrice) {
        this.agreedPrice = agreedPrice;
    }
}
