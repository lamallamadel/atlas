package com.example.backend.controller;

import com.example.backend.dto.UserPreferencesDTO;
import com.example.backend.service.UserPreferencesService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;

import java.util.HashMap;
import java.util.Map;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(UserPreferencesController.class)
class UserPreferencesControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private UserPreferencesService userPreferencesService;

    private static final String TEST_USER_ID = "user-123";

    @Test
    @WithMockUser(roles = "PRO")
    void getUserPreferences_ReturnsPreferences() throws Exception {
        UserPreferencesDTO dto = createTestDTO();
        when(userPreferencesService.getUserPreferences(TEST_USER_ID)).thenReturn(dto);

        mockMvc.perform(get("/api/v1/user-preferences/{userId}", TEST_USER_ID))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.userId").value(TEST_USER_ID))
                .andExpect(jsonPath("$.theme").value("dark"));
    }

    @Test
    @WithMockUser(roles = "PRO")
    void updateUserPreferences_UpdatesSuccessfully() throws Exception {
        UserPreferencesDTO dto = createTestDTO();
        when(userPreferencesService.saveUserPreferences(eq(TEST_USER_ID), any(UserPreferencesDTO.class)))
                .thenReturn(dto);

        mockMvc.perform(put("/api/v1/user-preferences/{userId}", TEST_USER_ID)
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(dto)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.userId").value(TEST_USER_ID));
    }

    @Test
    @WithMockUser(roles = "PRO")
    void updateDashboardLayout_UpdatesLayout() throws Exception {
        Map<String, Object> layout = new HashMap<>();
        layout.put("widgets", new Object[]{});

        UserPreferencesDTO dto = createTestDTO();
        when(userPreferencesService.updateDashboardLayout(eq(TEST_USER_ID), any()))
                .thenReturn(dto);

        mockMvc.perform(put("/api/v1/user-preferences/{userId}/dashboard-layout", TEST_USER_ID)
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(layout)))
                .andExpect(status().isOk());
    }

    @Test
    @WithMockUser(roles = "PRO")
    void applyRoleTemplate_AppliesTemplate() throws Exception {
        UserPreferencesDTO dto = createTestDTO();
        dto.setRoleTemplate("agent");
        when(userPreferencesService.applyRoleTemplate(TEST_USER_ID, "agent"))
                .thenReturn(dto);

        mockMvc.perform(post("/api/v1/user-preferences/{userId}/apply-template", TEST_USER_ID)
                        .with(csrf())
                        .param("template", "agent"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.roleTemplate").value("agent"));
    }

    @Test
    @WithMockUser(roles = "PRO")
    void deleteUserPreferences_DeletesSuccessfully() throws Exception {
        mockMvc.perform(delete("/api/v1/user-preferences/{userId}", TEST_USER_ID)
                        .with(csrf()))
                .andExpect(status().isNoContent());

        verify(userPreferencesService).deleteUserPreferences(TEST_USER_ID);
    }

    @Test
    @WithMockUser(roles = "PRO")
    void exportConfiguration_ExportsSuccessfully() throws Exception {
        UserPreferencesDTO dto = createTestDTO();
        when(userPreferencesService.getUserPreferences(TEST_USER_ID)).thenReturn(dto);

        mockMvc.perform(post("/api/v1/user-preferences/{userId}/export", TEST_USER_ID)
                        .with(csrf()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.dashboardLayout").exists());
    }

    @Test
    @WithMockUser(roles = "PRO")
    void importConfiguration_ImportsSuccessfully() throws Exception {
        Map<String, Object> config = new HashMap<>();
        config.put("dashboardLayout", new HashMap<>());
        config.put("roleTemplate", "agent");

        UserPreferencesDTO dto = createTestDTO();
        when(userPreferencesService.saveUserPreferences(eq(TEST_USER_ID), any()))
                .thenReturn(dto);

        mockMvc.perform(post("/api/v1/user-preferences/{userId}/import", TEST_USER_ID)
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(config)))
                .andExpect(status().isOk());
    }

    @Test
    void getUserPreferences_Unauthorized_Returns401() throws Exception {
        mockMvc.perform(get("/api/v1/user-preferences/{userId}", TEST_USER_ID))
                .andExpect(status().isUnauthorized());
    }

    private UserPreferencesDTO createTestDTO() {
        UserPreferencesDTO dto = new UserPreferencesDTO();
        dto.setUserId(TEST_USER_ID);
        dto.setTheme("dark");
        dto.setLanguage("fr");
        dto.setDashboardLayout(new HashMap<>());
        dto.setWidgetSettings(new HashMap<>());
        dto.setGeneralPreferences(new HashMap<>());
        return dto;
    }
}
