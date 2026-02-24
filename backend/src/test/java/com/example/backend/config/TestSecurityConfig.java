package com.example.backend.config;

import com.fasterxml.jackson.databind.DeserializationFeature;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.autoconfigure.condition.ConditionalOnMissingBean;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Primary;

@TestConfiguration
public class TestSecurityConfig {

    private static final Logger log = LoggerFactory.getLogger(TestSecurityConfig.class);

    /**
     * ObjectMapper pour les tests qui ne chargent pas le contexte complet (sans JacksonConfig).
     * Ne crée le bean que s'il n'existe pas déjà (évite le conflit avec JacksonConfig en @SpringBootTest).
     */
    @Bean(name = "objectMapper")
    @Primary
    @ConditionalOnMissingBean(ObjectMapper.class)
    public ObjectMapper objectMapper() {
        log.debug("Configuring test ObjectMapper with JavaTimeModule and custom settings");
        ObjectMapper mapper = new ObjectMapper();

        mapper.registerModule(new JavaTimeModule());
        mapper.disable(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS);
        mapper.disable(SerializationFeature.WRITE_DATE_TIMESTAMPS_AS_NANOSECONDS);

        mapper.disable(SerializationFeature.WRITE_ENUMS_USING_TO_STRING);
        mapper.disable(DeserializationFeature.READ_ENUMS_USING_TO_STRING);

        mapper.disable(DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES);
        mapper.enable(DeserializationFeature.ACCEPT_EMPTY_STRING_AS_NULL_OBJECT);

        return mapper;
    }
}
