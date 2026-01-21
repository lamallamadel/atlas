package com.example.backend.dto;

import com.example.backend.entity.CoopLot;
import org.springframework.stereotype.Component;

@Component
public class CoopLotMapper {

    public CoopLot toEntity(CoopLotRequest request) {
        CoopLot lot = new CoopLot();
        lot.setLotNumber(request.getLotNumber());
        lot.setDescription(request.getDescription());
        lot.setSurfaceArea(request.getSurfaceArea());
        lot.setFloorNumber(request.getFloorNumber());
        lot.setBedrooms(request.getBedrooms());
        lot.setBathrooms(request.getBathrooms());
        lot.setPrice(request.getPrice());
        lot.setCurrency(request.getCurrency());
        lot.setStatus(request.getStatus());
        lot.setMeta(request.getMeta());
        return lot;
    }

    public void updateEntity(CoopLot lot, CoopLotRequest request) {
        if (request.getLotNumber() != null) {
            lot.setLotNumber(request.getLotNumber());
        }
        if (request.getDescription() != null) {
            lot.setDescription(request.getDescription());
        }
        if (request.getSurfaceArea() != null) {
            lot.setSurfaceArea(request.getSurfaceArea());
        }
        if (request.getFloorNumber() != null) {
            lot.setFloorNumber(request.getFloorNumber());
        }
        if (request.getBedrooms() != null) {
            lot.setBedrooms(request.getBedrooms());
        }
        if (request.getBathrooms() != null) {
            lot.setBathrooms(request.getBathrooms());
        }
        if (request.getPrice() != null) {
            lot.setPrice(request.getPrice());
        }
        if (request.getCurrency() != null) {
            lot.setCurrency(request.getCurrency());
        }
        if (request.getStatus() != null) {
            lot.setStatus(request.getStatus());
        }
        if (request.getMeta() != null) {
            lot.setMeta(request.getMeta());
        }
    }

    public CoopLotResponse toResponse(CoopLot lot) {
        CoopLotResponse response = new CoopLotResponse();
        response.setId(lot.getId());
        response.setProjectId(lot.getProject() != null ? lot.getProject().getId() : null);
        response.setMemberId(lot.getMember() != null ? lot.getMember().getId() : null);
        response.setLotNumber(lot.getLotNumber());
        response.setDescription(lot.getDescription());
        response.setSurfaceArea(lot.getSurfaceArea());
        response.setFloorNumber(lot.getFloorNumber());
        response.setBedrooms(lot.getBedrooms());
        response.setBathrooms(lot.getBathrooms());
        response.setPrice(lot.getPrice());
        response.setCurrency(lot.getCurrency());
        response.setStatus(lot.getStatus());
        response.setMeta(lot.getMeta());
        response.setCreatedAt(lot.getCreatedAt());
        response.setUpdatedAt(lot.getUpdatedAt());
        return response;
    }
}
