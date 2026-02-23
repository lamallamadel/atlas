package com.example.backend.controller;

import static org.hamcrest.Matchers.hasSize;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

import com.example.backend.dto.AnnonceCreateRequest;
import com.example.backend.dto.AnnonceResponse;
import com.example.backend.dto.AnnonceUpdateRequest;
import com.example.backend.entity.enums.AnnonceStatus;
import com.example.backend.service.AnnonceService;
import com.example.backend.service.CursorPaginationService;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.persistence.EntityNotFoundException;
import java.math.BigDecimal;
import java.util.Arrays;
import java.util.Collections;
import java.util.List;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;

@WebMvcTest(
        controllers = AnnonceController.class,
        excludeAutoConfiguration = {
            org.springframework.boot.autoconfigure.data.redis.RedisAutoConfiguration.class,
            org.springframework.boot.autoconfigure.data.elasticsearch
                    .ElasticsearchDataAutoConfiguration.class,
            org.springframework.boot.autoconfigure.mail.MailSenderAutoConfiguration.class,
            org.springframework.boot.autoconfigure.jdbc.DataSourceAutoConfiguration.class,
            org.springframework.boot.autoconfigure.orm.jpa.HibernateJpaAutoConfiguration.class,
            org.springframework.boot.autoconfigure.flyway.FlywayAutoConfiguration.class,
            org.springframework.boot.autoconfigure.task.TaskSchedulingAutoConfiguration.class
        },
        excludeFilters = {
            @org.springframework.context.annotation.ComponentScan.Filter(
                    type = org.springframework.context.annotation.FilterType.ASSIGNABLE_TYPE,
                    classes = {
                        com.example.backend.filter.RateLimitFilter.class,
                        com.example.backend.filter.DeprecationFilter.class,
                        com.example.backend.filter.RequestContextFilter.class,
                        com.example.backend.aspect.AuditAspect.class,
                        com.example.backend.config.WebConfig.class,
                        com.example.backend.config.HibernateFilterInterceptor.class,
                        com.example.backend.config.ElasticsearchConfig.class,
                        com.example.backend.config.CacheConfig.class,
                        com.example.backend.config.AsyncConfig.class,
                        com.example.backend.config.KeycloakAdminConfig.class,
                        com.example.backend.config.NotificationConfig.class,
                        com.example.backend.config.OutboundConfig.class,
                        com.example.backend.config.RateLimitConfig.class,
                        com.example.backend.config.Resilience4jConfig.class,
                        com.example.backend.config.StorageConfig.class,
                        com.example.backend.config.JpaAuditingConfig.class,
                        com.example.backend.config.ApiVersionRequestMappingHandlerMapping.class,
                        com.example.backend.config.StartupIndexAuditListener.class,
                        com.example.backend.config.JacksonConfig.class,
                        com.example.backend.config.SecurityConfig.class,
                        com.example.backend.config.MethodSecurityConfig.class,
                        com.example.backend.config.OpenApiConfig.class
                    })
        })
@Import(ControllerTestConfiguration.class)
@org.springframework.test.context.TestPropertySource(
        properties = {
            "spring.security.oauth2.resourceserver.jwt.issuer-uri=mock",
            "elasticsearch.enabled=false",
            "cache.redis.enabled=false",
            "rate-limit.enabled=false",
            "outbound.worker.enabled=false",
            "outbound.alert.enabled=false",
            "database.index-audit.enabled=false",
            "spring.mail.enabled=false",
            "spring.task.scheduling.enabled=false",
            "spring.cache.type=none",
            "logging.level.com.example.backend=DEBUG",
            "logging.level.TEST_BEAN_CREATION=INFO",
            "logging.level.TEST_CONTEXT=INFO",
            "logging.level.TEST_CONTEXT_ERROR=ERROR"
        })
@org.springframework.test.context.ActiveProfiles("test")
@WithMockUser(roles = "ADMIN")
class AnnonceControllerTest {

    private static final Logger log = LoggerFactory.getLogger(AnnonceControllerTest.class);

    private static final String ORG_ID_HEADER = "X-Org-Id";
    private static final String CORRELATION_ID_HEADER = "X-Correlation-Id";
    private static final String ORG_ID = "org123";
    private static final String CORRELATION_ID = "test-correlation-id";

    @Autowired private MockMvc mockMvc;

    @Autowired private ObjectMapper objectMapper;

    @MockBean private AnnonceService annonceService;

    @MockBean private CursorPaginationService cursorPaginationService;

    private AnnonceCreateRequest createRequest;
    private AnnonceResponse mockResponse;
    private Long testAnnonceId = 1L;

    private <T extends org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder>
            T withHeaders(T builder) {
        return (T)
                builder.header(ORG_ID_HEADER, ORG_ID).header(CORRELATION_ID_HEADER, CORRELATION_ID);
    }

    @BeforeEach
    void setUp() {
        log.info("Setting up AnnonceControllerTest");
        reset(annonceService, cursorPaginationService);

        createRequest = new AnnonceCreateRequest();
        createRequest.setTitle("Test Annonce");
        createRequest.setDescription("Test Description");
        createRequest.setCategory("Electronics");
        createRequest.setCity("Paris");
        createRequest.setPrice(BigDecimal.valueOf(100.00));
        createRequest.setCurrency("EUR");

        mockResponse = new AnnonceResponse();
        mockResponse.setId(testAnnonceId);
        mockResponse.setOrgId(ORG_ID);
        mockResponse.setTitle("Test Annonce");
        mockResponse.setDescription("Test Description");
        mockResponse.setCategory("Electronics");
        mockResponse.setCity("Paris");
        mockResponse.setPrice(BigDecimal.valueOf(100.00));
        mockResponse.setCurrency("EUR");
        mockResponse.setStatus(AnnonceStatus.DRAFT);

        log.info("Test setup complete - mock response: {}", mockResponse);
    }

    // -------------------------------------------------------------------------
    // CREATE
    // -------------------------------------------------------------------------

    @Test
    void create_ValidRequest_Returns201WithCreatedEntity() throws Exception {
        log.info("TEST: create_ValidRequest_Returns201WithCreatedEntity");
        when(annonceService.create(any(AnnonceCreateRequest.class))).thenReturn(mockResponse);

        mockMvc.perform(
                        withHeaders(
                                post("/api/v1/annonces")
                                        .contentType(MediaType.APPLICATION_JSON)
                                        .content(objectMapper.writeValueAsString(createRequest))))
                .andExpect(status().isCreated())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.id").exists())
                .andExpect(jsonPath("$.orgId").value(ORG_ID))
                .andExpect(jsonPath("$.title").value("Test Annonce"))
                .andExpect(jsonPath("$.description").value("Test Description"))
                .andExpect(jsonPath("$.category").value("Electronics"))
                .andExpect(jsonPath("$.city").value("Paris"))
                .andExpect(jsonPath("$.price").value(100.00))
                .andExpect(jsonPath("$.currency").value("EUR"))
                .andExpect(jsonPath("$.status").value("DRAFT"));

        verify(annonceService, times(1)).create(any(AnnonceCreateRequest.class));
    }

    @Test
    void create_MissingTitle_Returns400() throws Exception {
        log.info("TEST: create_MissingTitle_Returns400");
        createRequest.setTitle(null);

        mockMvc.perform(
                        withHeaders(
                                post("/api/v1/annonces")
                                        .contentType(MediaType.APPLICATION_JSON)
                                        .content(objectMapper.writeValueAsString(createRequest))))
                .andExpect(status().isBadRequest());

        verify(annonceService, never()).create(any());
    }

    @Test
    void create_BlankTitle_Returns400() throws Exception {
        log.info("TEST: create_BlankTitle_Returns400");
        createRequest.setTitle("");

        mockMvc.perform(
                        withHeaders(
                                post("/api/v1/annonces")
                                        .contentType(MediaType.APPLICATION_JSON)
                                        .content(objectMapper.writeValueAsString(createRequest))))
                .andExpect(status().isBadRequest());

        verify(annonceService, never()).create(any());
    }

    @Test
    void create_TitleTooLong_Returns400() throws Exception {
        log.info("TEST: create_TitleTooLong_Returns400");
        createRequest.setTitle("A".repeat(501));

        mockMvc.perform(
                        withHeaders(
                                post("/api/v1/annonces")
                                        .contentType(MediaType.APPLICATION_JSON)
                                        .content(objectMapper.writeValueAsString(createRequest))))
                .andExpect(status().isBadRequest());

        verify(annonceService, never()).create(any());
    }

    @Test
    void create_NegativePrice_Returns400() throws Exception {
        log.info("TEST: create_NegativePrice_Returns400");
        createRequest.setPrice(BigDecimal.valueOf(-10.00));

        mockMvc.perform(
                        withHeaders(
                                post("/api/v1/annonces")
                                        .contentType(MediaType.APPLICATION_JSON)
                                        .content(objectMapper.writeValueAsString(createRequest))))
                .andExpect(status().isBadRequest());

        verify(annonceService, never()).create(any());
    }

    @Test
    void create_MissingTenantHeader_Returns400() throws Exception {
        log.info("TEST: create_MissingTenantHeader_Returns400");
        mockMvc.perform(
                        post("/api/v1/annonces")
                                .contentType(MediaType.APPLICATION_JSON)
                                .header(CORRELATION_ID_HEADER, CORRELATION_ID)
                                .content(objectMapper.writeValueAsString(createRequest)))
                .andExpect(status().isBadRequest())
                .andExpect(header().string(CORRELATION_ID_HEADER, CORRELATION_ID));

        verify(annonceService, never()).create(any());
    }

    // -------------------------------------------------------------------------
    // GET
    // -------------------------------------------------------------------------

    @Test
    void getById_ExistingId_Returns200WithEntity() throws Exception {
        log.info("TEST: getById_ExistingId_Returns200WithEntity");
        when(annonceService.getById(testAnnonceId)).thenReturn(mockResponse);

        mockMvc.perform(withHeaders(get("/api/v1/annonces/" + testAnnonceId)))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.id").value(testAnnonceId))
                .andExpect(jsonPath("$.title").value("Test Annonce"))
                .andExpect(jsonPath("$.orgId").value(ORG_ID));

        verify(annonceService, times(1)).getById(testAnnonceId);
    }

    @Test
    void getById_NonExistingId_Returns404() throws Exception {
        log.info("TEST: getById_NonExistingId_Returns404");
        Long nonExistingId = 999L;
        when(annonceService.getById(nonExistingId))
                .thenThrow(new EntityNotFoundException("Annonce not found"));

        mockMvc.perform(withHeaders(get("/api/v1/annonces/" + nonExistingId)))
                .andExpect(status().isNotFound());

        verify(annonceService, times(1)).getById(nonExistingId);
    }

    // -------------------------------------------------------------------------
    // UPDATE
    // -------------------------------------------------------------------------

    @Test
    void update_ValidRequest_Returns200() throws Exception {
        log.info("TEST: update_ValidRequest_Returns200");
        AnnonceUpdateRequest updateRequest = new AnnonceUpdateRequest();
        updateRequest.setTitle("Updated Title");
        updateRequest.setStatus(AnnonceStatus.PUBLISHED);

        AnnonceResponse updatedResponse = new AnnonceResponse();
        updatedResponse.setId(testAnnonceId);
        updatedResponse.setOrgId(ORG_ID);
        updatedResponse.setTitle("Updated Title");
        updatedResponse.setDescription("Test Description");
        updatedResponse.setCategory("Electronics");
        updatedResponse.setCity("Paris");
        updatedResponse.setPrice(BigDecimal.valueOf(100.00));
        updatedResponse.setCurrency("EUR");
        updatedResponse.setStatus(AnnonceStatus.PUBLISHED);

        when(annonceService.update(eq(testAnnonceId), any(AnnonceUpdateRequest.class)))
                .thenReturn(updatedResponse);

        mockMvc.perform(
                        withHeaders(
                                put("/api/v1/annonces/" + testAnnonceId)
                                        .contentType(MediaType.APPLICATION_JSON)
                                        .content(objectMapper.writeValueAsString(updateRequest))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(testAnnonceId))
                .andExpect(jsonPath("$.title").value("Updated Title"))
                .andExpect(jsonPath("$.status").value("PUBLISHED"));

        verify(annonceService, times(1)).update(eq(testAnnonceId), any(AnnonceUpdateRequest.class));
    }

    @Test
    void update_NonExistingId_Returns404() throws Exception {
        log.info("TEST: update_NonExistingId_Returns404");
        Long nonExistingId = 999L;
        AnnonceUpdateRequest updateRequest = new AnnonceUpdateRequest();
        updateRequest.setTitle("Updated Title");

        when(annonceService.update(eq(nonExistingId), any(AnnonceUpdateRequest.class)))
                .thenThrow(new EntityNotFoundException("Annonce not found"));

        mockMvc.perform(
                        withHeaders(
                                put("/api/v1/annonces/" + nonExistingId)
                                        .contentType(MediaType.APPLICATION_JSON)
                                        .content(objectMapper.writeValueAsString(updateRequest))))
                .andExpect(status().isNotFound());

        verify(annonceService, times(1)).update(eq(nonExistingId), any(AnnonceUpdateRequest.class));
    }

    // -------------------------------------------------------------------------
    // LIST
    // -------------------------------------------------------------------------

    @Test
    void list_NoFilters_Returns200WithPagedResults() throws Exception {
        log.info("TEST: list_NoFilters_Returns200WithPagedResults");
        AnnonceResponse response1 = createMockResponse(1L, "Annonce 1", AnnonceStatus.PUBLISHED);
        AnnonceResponse response2 = createMockResponse(2L, "Annonce 2", AnnonceStatus.DRAFT);
        Page<AnnonceResponse> page =
                new PageImpl<>(Arrays.asList(response1, response2), PageRequest.of(0, 20), 2);

        when(annonceService.list(isNull(), isNull(), isNull(), isNull(), any(Pageable.class)))
                .thenReturn(page);

        mockMvc.perform(withHeaders(get("/api/v1/annonces")))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.content", hasSize(2)))
                .andExpect(jsonPath("$.totalElements").value(2))
                .andExpect(jsonPath("$.size").value(20));

        verify(annonceService, times(1))
                .list(isNull(), isNull(), isNull(), isNull(), any(Pageable.class));
    }

    @Test
    void list_WithStatusFilter_Returns200WithFilteredResults() throws Exception {
        log.info("TEST: list_WithStatusFilter_Returns200WithFilteredResults");
        AnnonceResponse response =
                createMockResponse(1L, "Published Annonce", AnnonceStatus.PUBLISHED);
        Page<AnnonceResponse> page =
                new PageImpl<>(Collections.singletonList(response), PageRequest.of(0, 20), 1);

        when(annonceService.list(
                        eq(AnnonceStatus.PUBLISHED),
                        isNull(),
                        isNull(),
                        isNull(),
                        any(Pageable.class)))
                .thenReturn(page);

        mockMvc.perform(withHeaders(get("/api/v1/annonces").param("status", "PUBLISHED")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content", hasSize(1)))
                .andExpect(jsonPath("$.content[0].status").value("PUBLISHED"))
                .andExpect(jsonPath("$.totalElements").value(1));

        verify(annonceService, times(1))
                .list(
                        eq(AnnonceStatus.PUBLISHED),
                        isNull(),
                        isNull(),
                        isNull(),
                        any(Pageable.class));
    }

    @Test
    void list_WithSearchQuery_Returns200WithMatchingResults() throws Exception {
        log.info("TEST: list_WithSearchQuery_Returns200WithMatchingResults");
        AnnonceResponse response =
                createMockResponse(1L, "Electronics in Paris", AnnonceStatus.PUBLISHED);
        Page<AnnonceResponse> page =
                new PageImpl<>(Collections.singletonList(response), PageRequest.of(0, 20), 1);

        when(annonceService.list(
                        isNull(), eq("Electronics"), isNull(), isNull(), any(Pageable.class)))
                .thenReturn(page);

        mockMvc.perform(withHeaders(get("/api/v1/annonces").param("q", "Electronics")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content", hasSize(1)))
                .andExpect(jsonPath("$.content[0].title").value("Electronics in Paris"))
                .andExpect(jsonPath("$.totalElements").value(1));

        verify(annonceService, times(1))
                .list(isNull(), eq("Electronics"), isNull(), isNull(), any(Pageable.class));
    }

    @Test
    void list_WithStatusAndSearchQuery_Returns200WithFilteredAndMatchingResults() throws Exception {
        log.info("TEST: list_WithStatusAndSearchQuery_Returns200WithFilteredAndMatchingResults");
        AnnonceResponse response =
                createMockResponse(1L, "Electronics in Paris", AnnonceStatus.PUBLISHED);
        Page<AnnonceResponse> page =
                new PageImpl<>(Collections.singletonList(response), PageRequest.of(0, 20), 1);

        when(annonceService.list(
                        eq(AnnonceStatus.PUBLISHED),
                        eq("Electronics"),
                        isNull(),
                        isNull(),
                        any(Pageable.class)))
                .thenReturn(page);

        mockMvc.perform(
                        withHeaders(
                                get("/api/v1/annonces")
                                        .param("status", "PUBLISHED")
                                        .param("q", "Electronics")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content", hasSize(1)))
                .andExpect(jsonPath("$.content[0].title").value("Electronics in Paris"))
                .andExpect(jsonPath("$.content[0].status").value("PUBLISHED"))
                .andExpect(jsonPath("$.totalElements").value(1));

        verify(annonceService, times(1))
                .list(
                        eq(AnnonceStatus.PUBLISHED),
                        eq("Electronics"),
                        isNull(),
                        isNull(),
                        any(Pageable.class));
    }

    @Test
    void list_WithPagination_Returns200WithCorrectPage() throws Exception {
        log.info("TEST: list_WithPagination_Returns200WithCorrectPage");
        List<AnnonceResponse> responses =
                Arrays.asList(
                        createMockResponse(11L, "Annonce 11", AnnonceStatus.PUBLISHED),
                        createMockResponse(12L, "Annonce 12", AnnonceStatus.PUBLISHED),
                        createMockResponse(13L, "Annonce 13", AnnonceStatus.PUBLISHED),
                        createMockResponse(14L, "Annonce 14", AnnonceStatus.PUBLISHED),
                        createMockResponse(15L, "Annonce 15", AnnonceStatus.PUBLISHED),
                        createMockResponse(16L, "Annonce 16", AnnonceStatus.PUBLISHED),
                        createMockResponse(17L, "Annonce 17", AnnonceStatus.PUBLISHED),
                        createMockResponse(18L, "Annonce 18", AnnonceStatus.PUBLISHED),
                        createMockResponse(19L, "Annonce 19", AnnonceStatus.PUBLISHED),
                        createMockResponse(20L, "Annonce 20", AnnonceStatus.PUBLISHED));
        Page<AnnonceResponse> page = new PageImpl<>(responses, PageRequest.of(1, 10), 25);

        when(annonceService.list(isNull(), isNull(), isNull(), isNull(), any(Pageable.class)))
                .thenReturn(page);

        mockMvc.perform(withHeaders(get("/api/v1/annonces").param("page", "1").param("size", "10")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content", hasSize(10)))
                .andExpect(jsonPath("$.number").value(1))
                .andExpect(jsonPath("$.size").value(10))
                .andExpect(jsonPath("$.totalElements").value(25));

        verify(annonceService, times(1))
                .list(isNull(), isNull(), isNull(), isNull(), any(Pageable.class));
    }

    @Test
    void list_WithSorting_Returns200WithSortedResults() throws Exception {
        log.info("TEST: list_WithSorting_Returns200WithSortedResults");
        AnnonceResponse responseA = createMockResponse(1L, "Annonce A", AnnonceStatus.PUBLISHED);
        AnnonceResponse responseB = createMockResponse(2L, "Annonce B", AnnonceStatus.PUBLISHED);
        Page<AnnonceResponse> page =
                new PageImpl<>(Arrays.asList(responseA, responseB), PageRequest.of(0, 20), 2);

        when(annonceService.list(isNull(), isNull(), isNull(), isNull(), any(Pageable.class)))
                .thenReturn(page);

        mockMvc.perform(withHeaders(get("/api/v1/annonces").param("sort", "title,asc")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content", hasSize(2)))
                .andExpect(jsonPath("$.content[0].title").value("Annonce A"))
                .andExpect(jsonPath("$.content[1].title").value("Annonce B"));

        verify(annonceService, times(1))
                .list(isNull(), isNull(), isNull(), isNull(), any(Pageable.class));
    }

    @Test
    void list_EmptyResult_Returns200WithEmptyPage() throws Exception {
        log.info("TEST: list_EmptyResult_Returns200WithEmptyPage");
        Page<AnnonceResponse> emptyPage =
                new PageImpl<>(Collections.emptyList(), PageRequest.of(0, 20), 0);

        when(annonceService.list(isNull(), isNull(), isNull(), isNull(), any(Pageable.class)))
                .thenReturn(emptyPage);

        mockMvc.perform(withHeaders(get("/api/v1/annonces")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content", hasSize(0)))
                .andExpect(jsonPath("$.totalElements").value(0));

        verify(annonceService, times(1))
                .list(isNull(), isNull(), isNull(), isNull(), any(Pageable.class));
    }

    // -------------------------------------------------------------------------
    // Helper methods
    // -------------------------------------------------------------------------

    private AnnonceResponse createMockResponse(Long id, String title, AnnonceStatus status) {
        AnnonceResponse response = new AnnonceResponse();
        response.setId(id);
        response.setOrgId(ORG_ID);
        response.setTitle(title);
        response.setDescription("Test Description");
        response.setCategory("Electronics");
        response.setCity("Paris");
        response.setPrice(BigDecimal.valueOf(100.00));
        response.setCurrency("EUR");
        response.setStatus(status);
        return response;
    }
}
