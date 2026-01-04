package com.example.backend.dto;

import com.example.backend.entity.Dossier;
import com.example.backend.entity.MessageEntity;
import org.springframework.stereotype.Component;

@Component
public class MessageMapper {

    public MessageEntity toEntity(MessageCreateRequest request, Dossier dossier, String orgId) {
        MessageEntity message = new MessageEntity();
        message.setDossier(dossier);
        message.setChannel(request.getChannel());
        message.setDirection(request.getDirection());
        message.setContent(request.getContent());
        message.setTimestamp(request.getTimestamp());
        message.setOrgId(orgId);
        return message;
    }

    public MessageResponse toResponse(MessageEntity message) {
        MessageResponse response = new MessageResponse();
        response.setId(message.getId());
        response.setOrgId(message.getOrgId());
        response.setDossierId(message.getDossier().getId());
        response.setChannel(message.getChannel());
        response.setDirection(message.getDirection());
        response.setContent(message.getContent());
        response.setTimestamp(message.getTimestamp());
        response.setCreatedAt(message.getCreatedAt());
        return response;
    }
}
