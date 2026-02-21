package com.example.backend.entity.enums;

import static org.junit.jupiter.api.Assertions.*;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;

class ConsentementStatusTest {

    private final ObjectMapper objectMapper = new ObjectMapper();

    @Test
    void testEnumValues() {
        assertEquals("granted", ConsentementStatus.GRANTED.getValue());
        assertEquals("denied", ConsentementStatus.DENIED.getValue());
        assertEquals("pending", ConsentementStatus.PENDING.getValue());
        assertEquals("revoked", ConsentementStatus.REVOKED.getValue());
        assertEquals("expired", ConsentementStatus.EXPIRED.getValue());
    }

    @Test
    void testFromValue() {
        assertEquals(ConsentementStatus.GRANTED, ConsentementStatus.fromValue("granted"));
        assertEquals(ConsentementStatus.DENIED, ConsentementStatus.fromValue("denied"));
        assertEquals(ConsentementStatus.PENDING, ConsentementStatus.fromValue("pending"));
        assertEquals(ConsentementStatus.REVOKED, ConsentementStatus.fromValue("revoked"));
        assertEquals(ConsentementStatus.EXPIRED, ConsentementStatus.fromValue("expired"));
    }

    @Test
    void testFromValueThrowsException() {
        assertThrows(IllegalArgumentException.class, () -> ConsentementStatus.fromValue("invalid"));
    }

    @Test
    void testJsonSerialization() throws Exception {
        String json = objectMapper.writeValueAsString(ConsentementStatus.GRANTED);
        assertEquals("\"GRANTED\"", json);
    }

    @Test
    void testJsonDeserialization() throws Exception {
        ConsentementStatus status = objectMapper.readValue("\"GRANTED\"", ConsentementStatus.class);
        assertEquals(ConsentementStatus.GRANTED, status);
    }
}
