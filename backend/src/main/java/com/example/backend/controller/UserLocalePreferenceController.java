package com.example.backend.controller;

import com.example.backend.dto.UserLocalePreferenceDto;
import com.example.backend.service.UserPreferencesService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/user-preferences/locale")
public class UserLocalePreferenceController {

    private final UserPreferencesService userPreferencesService;

    public UserLocalePreferenceController(UserPreferencesService userPreferencesService) {
        this.userPreferencesService = userPreferencesService;
    }

    @GetMapping
    public ResponseEntity<UserLocalePreferenceDto> getUserLocalePreference() {
        UserLocalePreferenceDto preference = userPreferencesService.getUserLocalePreference();
        return ResponseEntity.ok(preference);
    }

    @PostMapping
    public ResponseEntity<UserLocalePreferenceDto> saveUserLocalePreference(
            @Valid @RequestBody UserLocalePreferenceDto preferenceDto) {
        UserLocalePreferenceDto saved =
                userPreferencesService.saveUserLocalePreference(preferenceDto);
        return ResponseEntity.ok(saved);
    }
}
