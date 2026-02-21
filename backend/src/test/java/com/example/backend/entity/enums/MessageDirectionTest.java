package com.example.backend.entity.enums;

import static org.junit.jupiter.api.Assertions.*;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;

class MessageDirectionTest {

    private final ObjectMapper objectMapper = new ObjectMapper();

    @Test
    void testEnumValues() {
        assertEquals("inbound", MessageDirection.INBOUND.getValue());
        assertEquals("outbound", MessageDirection.OUTBOUND.getValue());
    }

    @Test
    void testFromValue() {
        assertEquals(MessageDirection.INBOUND, MessageDirection.fromValue("inbound"));
        assertEquals(MessageDirection.OUTBOUND, MessageDirection.fromValue("outbound"));
    }

    @Test
    void testFromValueThrowsException() {
        assertThrows(IllegalArgumentException.class, () -> MessageDirection.fromValue("invalid"));
    }

    @Test
    void testJsonSerialization() throws Exception {
        String json = objectMapper.writeValueAsString(MessageDirection.INBOUND);
        assertEquals("\"INBOUND\"", json);
    }

    @Test
    void testJsonDeserialization() throws Exception {
        MessageDirection direction = objectMapper.readValue("\"INBOUND\"", MessageDirection.class);
        assertEquals(MessageDirection.INBOUND, direction);
    }
}
