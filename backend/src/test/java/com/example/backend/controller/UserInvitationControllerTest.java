package com.example.backend.controller;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.example.backend.config.RateLimitConfig;
import com.example.backend.dto.UserInviteRequest;
import com.example.backend.dto.UserInviteResponse;
import com.example.backend.service.ApiKeyService;
import com.example.backend.service.ApiUsageTrackingService;
import com.example.backend.service.RateLimitService;
import com.example.backend.service.UserService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

@WebMvcTest(UserInvitationController.class)
@Import(ControllerTestConfiguration.class)
class UserInvitationControllerTest {

    @Autowired private MockMvc mockMvc;

    @Autowired private ObjectMapper objectMapper;

    @MockitoBean private UserService userService;

    @MockitoBean private ApiKeyService apiKeyService;

    @MockitoBean private ApiUsageTrackingService apiUsageTrackingService;

    @MockitoBean private RateLimitService rateLimitService;

    @MockitoBean private RateLimitConfig rateLimitConfig;

    @Test
    @WithMockUser(roles = "ADMIN")
    void testInviteUser_Success() throws Exception {
        UserInviteRequest request = new UserInviteRequest();
        request.setEmail("test@example.com");
        request.setFirstName("John");
        request.setLastName("Doe");

        UserInviteResponse response =
                new UserInviteResponse("user123", "test@example.com", "INVITED");

        when(userService.inviteUser(any(UserInviteRequest.class))).thenReturn(response);

        mockMvc.perform(
                        post("/api/v1/users/invite")
                                .header("X-Org-Id", "org1")
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").value("user123"))
                .andExpect(jsonPath("$.email").value("test@example.com"))
                .andExpect(jsonPath("$.status").value("INVITED"));
    }

    @Test
    @WithMockUser(roles = "PRO")
    void testInviteUser_agentForbidden() throws Exception {
        UserInviteRequest request = new UserInviteRequest();
        request.setEmail("test@example.com");
        request.setFirstName("John");
        request.setLastName("Doe");

        mockMvc.perform(
                        post("/api/v1/users/invite")
                                .header("X-Org-Id", "org1")
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isForbidden());
    }

    @Test
    @WithMockUser(roles = "MANAGER")
    void testInviteUser_ValidationFailure() throws Exception {
        UserInviteRequest request = new UserInviteRequest();
        // Missing required fields

        mockMvc.perform(
                        post("/api/v1/users/invite")
                                .header("X-Org-Id", "org1")
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());
    }
}
