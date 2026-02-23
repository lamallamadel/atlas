package com.example.backend;

import static org.assertj.core.api.Assertions.assertThat;

import ch.qos.logback.classic.Logger;
import ch.qos.logback.classic.spi.ILoggingEvent;
import ch.qos.logback.core.read.ListAppender;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.boot.test.web.client.TestRestTemplate;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;

@ActiveProfiles("test")
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
class CorrelationIdIdempotenceTest {

    private static final String CORRELATION_ID_HEADER = "X-Correlation-Id";

    @LocalServerPort private int port;

    @Autowired private TestRestTemplate restTemplate;

    private ListAppender<ILoggingEvent> listAppender;
    private Logger logger;

    @BeforeEach
    void setUp() {
        logger = (Logger) LoggerFactory.getLogger("com.example.backend");
        listAppender = new ListAppender<>();
        listAppender.start();
        logger.addAppender(listAppender);
    }

    @AfterEach
    void tearDown() {
        if (logger != null && listAppender != null) {
            logger.detachAppender(listAppender);
        }
    }

    @Test
    void whenCorrelationIdHeaderProvided_thenSameValueAppearsInResponseHeaderAndLogs() {
        String providedCorrelationId = "test-correlation-id-12345";
        String url = "http://localhost:" + port + "/api/v1/ping";

        HttpHeaders headers = new HttpHeaders();
        headers.set(CORRELATION_ID_HEADER, providedCorrelationId);
        HttpEntity<String> entity = new HttpEntity<>(headers);

        ResponseEntity<String> response =
                restTemplate.exchange(url, HttpMethod.GET, entity, String.class);

        assertThat(response.getHeaders().getFirst(CORRELATION_ID_HEADER))
                .isEqualTo(providedCorrelationId);

        boolean foundInLogs =
                listAppender.list.stream()
                        .anyMatch(
                                event -> {
                                    String correlationId =
                                            event.getMDCPropertyMap().get("correlationId");
                                    return providedCorrelationId.equals(correlationId);
                                });

        assertThat(foundInLogs).as("Correlation ID should appear in logs").isTrue();
    }

    @Test
    void whenCorrelationIdHeaderAbsent_thenUuidIsGeneratedAndReturned() {
        String url = "http://localhost:" + port + "/api/v1/ping";

        ResponseEntity<String> response = restTemplate.getForEntity(url, String.class);

        String correlationId = response.getHeaders().getFirst(CORRELATION_ID_HEADER);

        assertThat(correlationId)
                .as("Correlation ID should be present in response header")
                .isNotNull()
                .isNotEmpty();

        assertThat(correlationId)
                .as("Generated correlation ID should be a valid UUID format")
                .matches(
                        "^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$");

        boolean foundInLogs =
                listAppender.list.stream()
                        .anyMatch(
                                event -> {
                                    String logCorrelationId =
                                            event.getMDCPropertyMap().get("correlationId");
                                    return correlationId.equals(logCorrelationId);
                                });

        assertThat(foundInLogs).as("Generated correlation ID should appear in logs").isTrue();
    }
}
