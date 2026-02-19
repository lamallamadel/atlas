package com.example.backend.entity.enums;

import static org.junit.jupiter.api.Assertions.*;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;

class ConsentementChannelTest {

    private final ObjectMapper objectMapper = new ObjectMapper();

    @Test
    void testEnumValues() {
        assertEquals("email", ConsentementChannel.EMAIL.getValue());
        assertEquals("sms", ConsentementChannel.SMS.getValue());
        assertEquals("phone", ConsentementChannel.PHONE.getValue());
        assertEquals("whatsapp", ConsentementChannel.WHATSAPP.getValue());
        assertEquals("postal_mail", ConsentementChannel.POSTAL_MAIL.getValue());
        assertEquals("in_person", ConsentementChannel.IN_PERSON.getValue());
    }

    @Test
    void testFromValue() {
        assertEquals(ConsentementChannel.EMAIL, ConsentementChannel.fromValue("email"));
        assertEquals(ConsentementChannel.SMS, ConsentementChannel.fromValue("sms"));
        assertEquals(ConsentementChannel.PHONE, ConsentementChannel.fromValue("phone"));
        assertEquals(ConsentementChannel.WHATSAPP, ConsentementChannel.fromValue("whatsapp"));
        assertEquals(ConsentementChannel.POSTAL_MAIL, ConsentementChannel.fromValue("postal_mail"));
        assertEquals(ConsentementChannel.IN_PERSON, ConsentementChannel.fromValue("in_person"));
    }

    @Test
    void testFromValueThrowsException() {
        assertThrows(
                IllegalArgumentException.class, () -> ConsentementChannel.fromValue("invalid"));
    }

    @Test
    void testJsonSerialization() throws Exception {
        String json = objectMapper.writeValueAsString(ConsentementChannel.EMAIL);
        assertEquals("\"EMAIL\"", json);
    }

    @Test
    void testJsonDeserialization() throws Exception {
        ConsentementChannel channel =
                objectMapper.readValue("\"EMAIL\"", ConsentementChannel.class);
        assertEquals(ConsentementChannel.EMAIL, channel);
    }
}
