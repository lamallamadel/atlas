package com.example.backend.controller;

import com.example.backend.dto.UserInviteRequest;
import com.example.backend.dto.UserInviteResponse;
import com.example.backend.service.UserService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/users")
@Tag(name = "User Management", description = "API for managing users and agents")
public class UserInvitationController {

    private final UserService userService;

    public UserInvitationController(UserService userService) {
        this.userService = userService;
    }

    @PostMapping("/invite")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'SUPER_ADMIN')")
    @Operation(
            summary = "Invite a new user",
            description =
                    "Creates a new user in Keycloak with the requested agency role (ADMIN, MANAGER, AGENT) and sends an invitation email. Admins invite any role, managers invite agents. Enforces maxUsers quota.")
    public ResponseEntity<UserInviteResponse> inviteUser(
            @Valid @RequestBody UserInviteRequest request) {
        UserInviteResponse response = userService.inviteUser(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }
}
