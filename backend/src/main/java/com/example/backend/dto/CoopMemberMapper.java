package com.example.backend.dto;

import com.example.backend.entity.CoopMember;
import org.springframework.stereotype.Component;

@Component
public class CoopMemberMapper {

    public CoopMember toEntity(CoopMemberRequest request) {
        CoopMember member = new CoopMember();
        member.setFirstName(request.getFirstName());
        member.setLastName(request.getLastName());
        member.setEmail(request.getEmail());
        member.setPhone(request.getPhone());
        member.setAddress(request.getAddress());
        member.setCity(request.getCity());
        member.setPostalCode(request.getPostalCode());
        member.setDateOfBirth(request.getDateOfBirth());
        member.setMemberNumber(request.getMemberNumber());
        member.setJoinDate(request.getJoinDate());
        member.setStatus(request.getStatus());
        member.setMeta(request.getMeta());
        return member;
    }

    public void updateEntity(CoopMember member, CoopMemberRequest request) {
        if (request.getFirstName() != null) {
            member.setFirstName(request.getFirstName());
        }
        if (request.getLastName() != null) {
            member.setLastName(request.getLastName());
        }
        if (request.getEmail() != null) {
            member.setEmail(request.getEmail());
        }
        if (request.getPhone() != null) {
            member.setPhone(request.getPhone());
        }
        if (request.getAddress() != null) {
            member.setAddress(request.getAddress());
        }
        if (request.getCity() != null) {
            member.setCity(request.getCity());
        }
        if (request.getPostalCode() != null) {
            member.setPostalCode(request.getPostalCode());
        }
        if (request.getDateOfBirth() != null) {
            member.setDateOfBirth(request.getDateOfBirth());
        }
        if (request.getMemberNumber() != null) {
            member.setMemberNumber(request.getMemberNumber());
        }
        if (request.getJoinDate() != null) {
            member.setJoinDate(request.getJoinDate());
        }
        if (request.getStatus() != null) {
            member.setStatus(request.getStatus());
        }
        if (request.getMeta() != null) {
            member.setMeta(request.getMeta());
        }
    }

    public CoopMemberResponse toResponse(CoopMember member) {
        CoopMemberResponse response = new CoopMemberResponse();
        response.setId(member.getId());
        response.setGroupId(member.getGroup() != null ? member.getGroup().getId() : null);
        response.setFirstName(member.getFirstName());
        response.setLastName(member.getLastName());
        response.setEmail(member.getEmail());
        response.setPhone(member.getPhone());
        response.setAddress(member.getAddress());
        response.setCity(member.getCity());
        response.setPostalCode(member.getPostalCode());
        response.setDateOfBirth(member.getDateOfBirth());
        response.setMemberNumber(member.getMemberNumber());
        response.setJoinDate(member.getJoinDate());
        response.setStatus(member.getStatus());
        response.setMeta(member.getMeta());
        response.setCreatedAt(member.getCreatedAt());
        response.setUpdatedAt(member.getUpdatedAt());
        return response;
    }
}
