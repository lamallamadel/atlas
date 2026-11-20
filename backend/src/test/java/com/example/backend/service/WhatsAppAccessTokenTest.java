package com.example.backend.service;

import static org.assertj.core.api.Assertions.assertThat;

import com.example.backend.entity.WhatsAppProviderConfig;
import org.junit.jupiter.api.Test;

class WhatsAppAccessTokenTest {

    @Test
    void stripsWhitespaceAndLineBreaksPastedWithTheToken() {
        WhatsAppProviderConfig config = new WhatsAppProviderConfig();
        config.setApiKeyEncrypted(" EAAf vWjH\r\nqv6MBT \n");

        assertThat(WhatsAppCloudApiProvider.accessToken(config)).isEqualTo("EAAfvWjHqv6MBT");
    }

    @Test
    void keepsNullWhenNoTokenIsConfigured() {
        assertThat(WhatsAppCloudApiProvider.accessToken(new WhatsAppProviderConfig())).isNull();
    }
}
