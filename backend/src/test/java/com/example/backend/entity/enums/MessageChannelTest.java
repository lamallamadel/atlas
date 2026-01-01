package com.example.backend.entity.enums;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

class MessageChannelTest {

    private final ObjectMapper objectMapper = new ObjectMapper();

    @Test
    void testEnumValues() {
        assertEquals("email", MessageChannel.EMAIL.getValue());
        assertEquals("sms", MessageChannel.SMS.getValue());
        assertEquals("whatsapp", MessageChannel.WHATSAPP.getValue());
        assertEquals("phone", MessageChannel.PHONE.getValue());
        assertEquals("chat", MessageChannel.CHAT.getValue());
        assertEquals("in_app", MessageChannel.IN_APP.getValue());
    }

    @Test
    void testFromValue() {
        assertEquals(MessageChannel.EMAIL, MessageChannel.fromValue("email"));
        assertEquals(MessageChannel.SMS, MessageChannel.fromValue("sms"));
        assertEquals(MessageChannel.WHATSAPP, MessageChannel.fromValue("whatsapp"));
        assertEquals(MessageChannel.PHONE, MessageChannel.fromValue("phone"));
        assertEquals(MessageChannel.CHAT, MessageChannel.fromValue("chat"));
        assertEquals(MessageChannel.IN_APP, MessageChannel.fromValue("in_app"));
    }

    @Test
    void testFromValueThrowsException() {
        assertThrows(IllegalArgumentException.class, () -> MessageChannel.fromValue("invalid"));
    }

    @Test
    void testJsonSerialization() throws Exception {
        String json = objectMapper.writeValueAsString(MessageChannel.EMAIL);
        assertEquals("\"EMAIL\"", json);
    }

    @Test
    void testJsonDeserialization() throws Exception {
        MessageChannel channel = objectMapper.readValue("\"EMAIL\"", MessageChannel.class);
        assertEquals(MessageChannel.EMAIL, channel);
    }
}
