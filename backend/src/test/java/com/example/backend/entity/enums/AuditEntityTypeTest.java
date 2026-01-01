package com.example.backend.entity.enums;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

class AuditEntityTypeTest {

    private final ObjectMapper objectMapper = new ObjectMapper();

    @Test
    void testEnumValues() {
        assertEquals("annonce", AuditEntityType.ANNONCE.getValue());
        assertEquals("dossier", AuditEntityType.DOSSIER.getValue());
        assertEquals("partie_prenante", AuditEntityType.PARTIE_PRENANTE.getValue());
        assertEquals("consentement", AuditEntityType.CONSENTEMENT.getValue());
        assertEquals("message", AuditEntityType.MESSAGE.getValue());
        assertEquals("user", AuditEntityType.USER.getValue());
        assertEquals("organization", AuditEntityType.ORGANIZATION.getValue());
    }

    @Test
    void testFromValue() {
        assertEquals(AuditEntityType.ANNONCE, AuditEntityType.fromValue("annonce"));
        assertEquals(AuditEntityType.DOSSIER, AuditEntityType.fromValue("dossier"));
        assertEquals(AuditEntityType.PARTIE_PRENANTE, AuditEntityType.fromValue("partie_prenante"));
        assertEquals(AuditEntityType.CONSENTEMENT, AuditEntityType.fromValue("consentement"));
        assertEquals(AuditEntityType.MESSAGE, AuditEntityType.fromValue("message"));
        assertEquals(AuditEntityType.USER, AuditEntityType.fromValue("user"));
        assertEquals(AuditEntityType.ORGANIZATION, AuditEntityType.fromValue("organization"));
    }

    @Test
    void testFromValueThrowsException() {
        assertThrows(IllegalArgumentException.class, () -> AuditEntityType.fromValue("invalid"));
    }

    @Test
    void testJsonSerialization() throws Exception {
        String json = objectMapper.writeValueAsString(AuditEntityType.ANNONCE);
        assertEquals("\"ANNONCE\"", json);
    }

    @Test
    void testJsonDeserialization() throws Exception {
        AuditEntityType type = objectMapper.readValue("\"ANNONCE\"", AuditEntityType.class);
        assertEquals(AuditEntityType.ANNONCE, type);
    }
}
