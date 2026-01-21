package com.example.backend.dto;

import com.example.backend.entity.CoopGroup;
import org.springframework.stereotype.Component;

@Component
public class CoopGroupMapper {

    public CoopGroup toEntity(CoopGroupRequest request) {
        CoopGroup group = new CoopGroup();
        group.setName(request.getName());
        group.setDescription(request.getDescription());
        group.setRegistrationNumber(request.getRegistrationNumber());
        group.setAddress(request.getAddress());
        group.setCity(request.getCity());
        group.setPostalCode(request.getPostalCode());
        group.setCountry(request.getCountry());
        group.setPhone(request.getPhone());
        group.setEmail(request.getEmail());
        group.setWebsite(request.getWebsite());
        return group;
    }

    public void updateEntity(CoopGroup group, CoopGroupRequest request) {
        if (request.getName() != null) {
            group.setName(request.getName());
        }
        if (request.getDescription() != null) {
            group.setDescription(request.getDescription());
        }
        if (request.getRegistrationNumber() != null) {
            group.setRegistrationNumber(request.getRegistrationNumber());
        }
        if (request.getAddress() != null) {
            group.setAddress(request.getAddress());
        }
        if (request.getCity() != null) {
            group.setCity(request.getCity());
        }
        if (request.getPostalCode() != null) {
            group.setPostalCode(request.getPostalCode());
        }
        if (request.getCountry() != null) {
            group.setCountry(request.getCountry());
        }
        if (request.getPhone() != null) {
            group.setPhone(request.getPhone());
        }
        if (request.getEmail() != null) {
            group.setEmail(request.getEmail());
        }
        if (request.getWebsite() != null) {
            group.setWebsite(request.getWebsite());
        }
    }

    public CoopGroupResponse toResponse(CoopGroup group) {
        CoopGroupResponse response = new CoopGroupResponse();
        response.setId(group.getId());
        response.setName(group.getName());
        response.setDescription(group.getDescription());
        response.setRegistrationNumber(group.getRegistrationNumber());
        response.setAddress(group.getAddress());
        response.setCity(group.getCity());
        response.setPostalCode(group.getPostalCode());
        response.setCountry(group.getCountry());
        response.setPhone(group.getPhone());
        response.setEmail(group.getEmail());
        response.setWebsite(group.getWebsite());
        response.setCreatedAt(group.getCreatedAt());
        response.setUpdatedAt(group.getUpdatedAt());
        return response;
    }
}
