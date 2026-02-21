package com.example.backend.service;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

import com.example.backend.dto.UserPreferencesDTO;
import com.example.backend.entity.UserPreferencesEntity;
import com.example.backend.repository.UserPreferencesRepository;
import com.example.backend.util.TenantContext;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class UserPreferencesServiceTest {

    @Mock private UserPreferencesRepository userPreferencesRepository;

    @InjectMocks private UserPreferencesService userPreferencesService;

    private static final String TEST_USER_ID = "user-123";
    private static final String TEST_ORG_ID = "org-456";

    @BeforeEach
    void setUp() {
        TenantContext.setOrgId(TEST_ORG_ID);
    }

    @AfterEach
    void tearDown() {
        TenantContext.clear();
    }

    @Test
    void getUserPreferences_WhenExists_ReturnsPreferences() {
        UserPreferencesEntity entity = createTestEntity();
        when(userPreferencesRepository.findByUserIdAndOrgId(TEST_USER_ID, TEST_ORG_ID))
                .thenReturn(Optional.of(entity));

        UserPreferencesDTO result = userPreferencesService.getUserPreferences(TEST_USER_ID);

        assertNotNull(result);
        assertEquals(TEST_USER_ID, result.getUserId());
        assertEquals("dark", result.getTheme());
    }

    @Test
    void getUserPreferences_WhenNotExists_ReturnsDefault() {
        when(userPreferencesRepository.findByUserIdAndOrgId(TEST_USER_ID, TEST_ORG_ID))
                .thenReturn(Optional.empty());

        UserPreferencesDTO result = userPreferencesService.getUserPreferences(TEST_USER_ID);

        assertNotNull(result);
        assertEquals(TEST_USER_ID, result.getUserId());
    }

    @Test
    void saveUserPreferences_CreatesNewEntity() {
        UserPreferencesDTO dto = new UserPreferencesDTO();
        dto.setUserId(TEST_USER_ID);
        dto.setTheme("dark");

        when(userPreferencesRepository.findByUserIdAndOrgId(TEST_USER_ID, TEST_ORG_ID))
                .thenReturn(Optional.empty());
        when(userPreferencesRepository.save(any(UserPreferencesEntity.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));

        UserPreferencesDTO result = userPreferencesService.saveUserPreferences(TEST_USER_ID, dto);

        assertNotNull(result);
        verify(userPreferencesRepository).save(any(UserPreferencesEntity.class));
    }

    @Test
    void updateDashboardLayout_UpdatesLayout() {
        UserPreferencesEntity entity = createTestEntity();
        Map<String, Object> newLayout = new HashMap<>();
        newLayout.put("widgets", new Object[] {});

        when(userPreferencesRepository.findByUserIdAndOrgId(TEST_USER_ID, TEST_ORG_ID))
                .thenReturn(Optional.of(entity));
        when(userPreferencesRepository.save(any(UserPreferencesEntity.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));

        UserPreferencesDTO result =
                userPreferencesService.updateDashboardLayout(TEST_USER_ID, newLayout);

        assertNotNull(result);
        verify(userPreferencesRepository).save(any(UserPreferencesEntity.class));
    }

    @Test
    void applyRoleTemplate_Agent_CreatesAgentLayout() {
        when(userPreferencesRepository.findByUserIdAndOrgId(TEST_USER_ID, TEST_ORG_ID))
                .thenReturn(Optional.empty());
        when(userPreferencesRepository.save(any(UserPreferencesEntity.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));

        UserPreferencesDTO result = userPreferencesService.applyRoleTemplate(TEST_USER_ID, "agent");

        assertNotNull(result);
        assertEquals("agent", result.getRoleTemplate());
        assertNotNull(result.getDashboardLayout());
        assertTrue(result.getDashboardLayout().containsKey("widgets"));
    }

    @Test
    void applyRoleTemplate_Manager_CreatesManagerLayout() {
        when(userPreferencesRepository.findByUserIdAndOrgId(TEST_USER_ID, TEST_ORG_ID))
                .thenReturn(Optional.empty());
        when(userPreferencesRepository.save(any(UserPreferencesEntity.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));

        UserPreferencesDTO result =
                userPreferencesService.applyRoleTemplate(TEST_USER_ID, "manager");

        assertNotNull(result);
        assertEquals("manager", result.getRoleTemplate());
        assertNotNull(result.getDashboardLayout());
    }

    @Test
    void deleteUserPreferences_CallsRepository() {
        userPreferencesService.deleteUserPreferences(TEST_USER_ID);

        verify(userPreferencesRepository).deleteByUserIdAndOrgId(TEST_USER_ID, TEST_ORG_ID);
    }

    private UserPreferencesEntity createTestEntity() {
        UserPreferencesEntity entity = new UserPreferencesEntity();
        entity.setId(1L);
        entity.setUserId(TEST_USER_ID);
        entity.setOrgId(TEST_ORG_ID);
        entity.setTheme("dark");
        entity.setLanguage("fr");
        entity.setDashboardLayout(new HashMap<>());
        entity.setWidgetSettings(new HashMap<>());
        entity.setGeneralPreferences(new HashMap<>());
        return entity;
    }
}
