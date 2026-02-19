package com.example.backend.entity.enums;

import static org.junit.jupiter.api.Assertions.*;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;

class AuditActionTest {

    private final ObjectMapper objectMapper = new ObjectMapper();

    @Test
    void testEnumValues() {
        assertEquals("created", AuditAction.CREATED.getValue());
        assertEquals("updated", AuditAction.UPDATED.getValue());
        assertEquals("deleted", AuditAction.DELETED.getValue());
        assertEquals("viewed", AuditAction.VIEWED.getValue());
        assertEquals("exported", AuditAction.EXPORTED.getValue());
        assertEquals("imported", AuditAction.IMPORTED.getValue());
        assertEquals("approved", AuditAction.APPROVED.getValue());
        assertEquals("rejected", AuditAction.REJECTED.getValue());
        assertEquals("archived", AuditAction.ARCHIVED.getValue());
        assertEquals("restored", AuditAction.RESTORED.getValue());
    }

    @Test
    void testFromValue() {
        assertEquals(AuditAction.CREATED, AuditAction.fromValue("created"));
        assertEquals(AuditAction.UPDATED, AuditAction.fromValue("updated"));
        assertEquals(AuditAction.DELETED, AuditAction.fromValue("deleted"));
        assertEquals(AuditAction.VIEWED, AuditAction.fromValue("viewed"));
        assertEquals(AuditAction.EXPORTED, AuditAction.fromValue("exported"));
        assertEquals(AuditAction.IMPORTED, AuditAction.fromValue("imported"));
        assertEquals(AuditAction.APPROVED, AuditAction.fromValue("approved"));
        assertEquals(AuditAction.REJECTED, AuditAction.fromValue("rejected"));
        assertEquals(AuditAction.ARCHIVED, AuditAction.fromValue("archived"));
        assertEquals(AuditAction.RESTORED, AuditAction.fromValue("restored"));
    }

    @Test
    void testFromValueThrowsException() {
        assertThrows(IllegalArgumentException.class, () -> AuditAction.fromValue("invalid"));
    }

    @Test
    void testJsonSerialization() throws Exception {
        String json = objectMapper.writeValueAsString(AuditAction.CREATED);
        assertEquals("\"CREATED\"", json);
    }

    @Test
    void testJsonDeserialization() throws Exception {
        AuditAction action = objectMapper.readValue("\"CREATED\"", AuditAction.class);
        assertEquals(AuditAction.CREATED, action);
    }
}
