package com.example.backend.controller;

import com.example.backend.service.UserService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/users")
@Tag(name = "Users", description = "API for user information resolution")
public class UserController {

    private final UserService userService;

    public UserController(UserService userService) {
        this.userService = userService;
    }

    @GetMapping("/{id}/display-name")
    @PreAuthorize("hasAnyRole('ADMIN', 'PRO')")
    @Operation(
            summary = "Get user display name",
            description =
                    "Retrieves the display name for a given user ID. Returns 'Système' for null/system users, "
                            + "'Utilisateur supprimé' for non-existent users, or the user's full name/email.")
    @ApiResponses(
            value = {
                @ApiResponse(
                        responseCode = "200",
                        description = "Display name retrieved successfully",
                        content =
                                @Content(
                                        schema =
                                                @Schema(
                                                        implementation =
                                                                UserDisplayNameResponse.class)))
            })
    public ResponseEntity<UserDisplayNameResponse> getDisplayName(
            @Parameter(description = "ID of the user to resolve", required = true) @PathVariable
                    String id) {
        String displayName = userService.getUserDisplayName(id);
        return ResponseEntity.ok(new UserDisplayNameResponse(id, displayName));
    }

    @Schema(description = "User display name response")
    public static class UserDisplayNameResponse {
        @Schema(description = "User ID", example = "user-123")
        private String userId;

        @Schema(description = "Display name", example = "John Doe")
        private String displayName;

        public UserDisplayNameResponse() {}

        public UserDisplayNameResponse(String userId, String displayName) {
            this.userId = userId;
            this.displayName = displayName;
        }

        public String getUserId() {
            return userId;
        }

        public void setUserId(String userId) {
            this.userId = userId;
        }

        public String getDisplayName() {
            return displayName;
        }

        public void setDisplayName(String displayName) {
            this.displayName = displayName;
        }
    }
}
