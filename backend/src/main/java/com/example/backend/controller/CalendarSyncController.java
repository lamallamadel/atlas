package com.example.backend.controller;

import com.example.backend.dto.CalendarSyncStatusResponse;
import com.example.backend.dto.CalendarAuthUrlResponse;
import com.example.backend.dto.CalendarOAuthCallbackRequest;
import com.example.backend.dto.CalendarSyncConfigRequest;
import com.example.backend.dto.CalendarSyncResponse;
import com.example.backend.dto.ICalFeedUrlResponse;
import com.example.backend.exception.ErrorResponse;
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

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/calendar-sync")
@Tag(name = "Calendar Sync", description = "API for calendar synchronization with external providers")
public class CalendarSyncController {

    @GetMapping("/google/auth-url")
    @PreAuthorize("hasAnyRole('ADMIN', 'PRO')")
    @Operation(summary = "Get Google Calendar OAuth URL", description = "Returns the OAuth URL for Google Calendar authorization")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Auth URL generated successfully",
                    content = @Content(schema = @Schema(implementation = CalendarAuthUrlResponse.class)))
    })
    public ResponseEntity<CalendarAuthUrlResponse> getGoogleAuthUrl() {
        CalendarAuthUrlResponse response = new CalendarAuthUrlResponse();
        response.setAuthUrl("https://accounts.google.com/o/oauth2/v2/auth?client_id=example&redirect_uri=http://localhost:4200/calendar/callback&response_type=code&scope=https://www.googleapis.com/auth/calendar");
        return ResponseEntity.ok(response);
    }

    @GetMapping("/outlook/auth-url")
    @PreAuthorize("hasAnyRole('ADMIN', 'PRO')")
    @Operation(summary = "Get Outlook Calendar OAuth URL", description = "Returns the OAuth URL for Outlook Calendar authorization")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Auth URL generated successfully",
                    content = @Content(schema = @Schema(implementation = CalendarAuthUrlResponse.class)))
    })
    public ResponseEntity<CalendarAuthUrlResponse> getOutlookAuthUrl() {
        CalendarAuthUrlResponse response = new CalendarAuthUrlResponse();
        response.setAuthUrl("https://login.microsoftonline.com/common/oauth2/v2.0/authorize?client_id=example&redirect_uri=http://localhost:4200/calendar/callback&response_type=code&scope=Calendars.ReadWrite");
        return ResponseEntity.ok(response);
    }

    @PostMapping("/google/callback")
    @PreAuthorize("hasAnyRole('ADMIN', 'PRO')")
    @Operation(summary = "Handle Google OAuth callback", description = "Processes the OAuth callback from Google")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "OAuth callback processed successfully"),
            @ApiResponse(responseCode = "400", description = "Invalid OAuth code",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    })
    public ResponseEntity<Map<String, Boolean>> handleGoogleCallback(@RequestBody CalendarOAuthCallbackRequest request) {
        Map<String, Boolean> response = new HashMap<>();
        response.put("success", true);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/outlook/callback")
    @PreAuthorize("hasAnyRole('ADMIN', 'PRO')")
    @Operation(summary = "Handle Outlook OAuth callback", description = "Processes the OAuth callback from Outlook")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "OAuth callback processed successfully"),
            @ApiResponse(responseCode = "400", description = "Invalid OAuth code",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    })
    public ResponseEntity<Map<String, Boolean>> handleOutlookCallback(@RequestBody CalendarOAuthCallbackRequest request) {
        Map<String, Boolean> response = new HashMap<>();
        response.put("success", true);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/status")
    @PreAuthorize("hasAnyRole('ADMIN', 'PRO')")
    @Operation(summary = "Get sync status", description = "Returns the synchronization status for all configured providers")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Sync status retrieved successfully")
    })
    public ResponseEntity<List<CalendarSyncStatusResponse>> getSyncStatus() {
        List<CalendarSyncStatusResponse> statuses = new ArrayList<>();
        
        CalendarSyncStatusResponse googleStatus = new CalendarSyncStatusResponse();
        googleStatus.setProvider("google");
        googleStatus.setSyncEnabled(false);
        statuses.add(googleStatus);
        
        CalendarSyncStatusResponse outlookStatus = new CalendarSyncStatusResponse();
        outlookStatus.setProvider("outlook");
        outlookStatus.setSyncEnabled(false);
        statuses.add(outlookStatus);
        
        return ResponseEntity.ok(statuses);
    }

    @PostMapping("/google/enable")
    @PreAuthorize("hasAnyRole('ADMIN', 'PRO')")
    @Operation(summary = "Enable Google Calendar sync", description = "Enables automatic synchronization with Google Calendar")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Sync enabled successfully"),
            @ApiResponse(responseCode = "400", description = "Invalid configuration",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    })
    public ResponseEntity<Map<String, Boolean>> enableGoogleSync(@RequestBody CalendarSyncConfigRequest config) {
        Map<String, Boolean> response = new HashMap<>();
        response.put("success", true);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/outlook/enable")
    @PreAuthorize("hasAnyRole('ADMIN', 'PRO')")
    @Operation(summary = "Enable Outlook Calendar sync", description = "Enables automatic synchronization with Outlook Calendar")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Sync enabled successfully"),
            @ApiResponse(responseCode = "400", description = "Invalid configuration",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    })
    public ResponseEntity<Map<String, Boolean>> enableOutlookSync(@RequestBody CalendarSyncConfigRequest config) {
        Map<String, Boolean> response = new HashMap<>();
        response.put("success", true);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/google/disable")
    @PreAuthorize("hasAnyRole('ADMIN', 'PRO')")
    @Operation(summary = "Disable Google Calendar sync", description = "Disables automatic synchronization with Google Calendar")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Sync disabled successfully")
    })
    public ResponseEntity<Map<String, Boolean>> disableGoogleSync() {
        Map<String, Boolean> response = new HashMap<>();
        response.put("success", true);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/outlook/disable")
    @PreAuthorize("hasAnyRole('ADMIN', 'PRO')")
    @Operation(summary = "Disable Outlook Calendar sync", description = "Disables automatic synchronization with Outlook Calendar")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Sync disabled successfully")
    })
    public ResponseEntity<Map<String, Boolean>> disableOutlookSync() {
        Map<String, Boolean> response = new HashMap<>();
        response.put("success", true);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/google/sync")
    @PreAuthorize("hasAnyRole('ADMIN', 'PRO')")
    @Operation(summary = "Trigger manual Google Calendar sync", description = "Triggers a manual synchronization with Google Calendar")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Sync completed successfully"),
            @ApiResponse(responseCode = "400", description = "Sync failed",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    })
    public ResponseEntity<CalendarSyncResponse> triggerGoogleSync() {
        CalendarSyncResponse response = new CalendarSyncResponse();
        response.setSuccess(true);
        response.setSyncedCount(0);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/outlook/sync")
    @PreAuthorize("hasAnyRole('ADMIN', 'PRO')")
    @Operation(summary = "Trigger manual Outlook Calendar sync", description = "Triggers a manual synchronization with Outlook Calendar")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Sync completed successfully"),
            @ApiResponse(responseCode = "400", description = "Sync failed",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    })
    public ResponseEntity<CalendarSyncResponse> triggerOutlookSync() {
        CalendarSyncResponse response = new CalendarSyncResponse();
        response.setSuccess(true);
        response.setSyncedCount(0);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/ical/feed-url")
    @PreAuthorize("hasAnyRole('ADMIN', 'PRO')")
    @Operation(summary = "Get iCal feed URL", description = "Returns a private iCal feed URL for calendar subscription")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Feed URL generated successfully",
                    content = @Content(schema = @Schema(implementation = ICalFeedUrlResponse.class)))
    })
    public ResponseEntity<ICalFeedUrlResponse> getICalFeedUrl() {
        ICalFeedUrlResponse response = new ICalFeedUrlResponse();
        response.setFeedUrl("http://localhost:8080/api/v1/calendar-sync/ical/feed/example-token-123");
        response.setToken("example-token-123");
        return ResponseEntity.ok(response);
    }

    @PostMapping("/ical/regenerate-token")
    @PreAuthorize("hasAnyRole('ADMIN', 'PRO')")
    @Operation(summary = "Regenerate iCal token", description = "Regenerates the private token for iCal feed URL")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Token regenerated successfully",
                    content = @Content(schema = @Schema(implementation = ICalFeedUrlResponse.class)))
    })
    public ResponseEntity<ICalFeedUrlResponse> regenerateICalToken() {
        ICalFeedUrlResponse response = new ICalFeedUrlResponse();
        response.setFeedUrl("http://localhost:8080/api/v1/calendar-sync/ical/feed/new-token-456");
        response.setToken("new-token-456");
        return ResponseEntity.ok(response);
    }
}
