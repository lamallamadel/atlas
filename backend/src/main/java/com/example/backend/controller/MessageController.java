package com.example.backend.controller;

import com.example.backend.dto.MessageCreateRequest;
import com.example.backend.dto.MessageResponse;
import com.example.backend.entity.enums.MessageChannel;
import com.example.backend.entity.enums.MessageDirection;
import com.example.backend.exception.ErrorResponse;
import com.example.backend.service.MessageService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.persistence.EntityNotFoundException;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/messages")
@Tag(name = "Messages", description = "API for managing messages")
public class MessageController {

    private final MessageService messageService;

    public MessageController(MessageService messageService) {
        this.messageService = messageService;
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'PRO')")
    @Operation(summary = "Create a new message", description = "Creates a new message for a dossier")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "201", description = "Message created successfully",
                    content = @Content(schema = @Schema(implementation = MessageResponse.class))),
            @ApiResponse(responseCode = "400", description = "Invalid request data",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class))),
            @ApiResponse(responseCode = "404", description = "Dossier not found",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    })
    public ResponseEntity<MessageResponse> create(@Valid @RequestBody MessageCreateRequest request) {
        MessageResponse response = messageService.create(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping("/{id:\\d+}")
    @PreAuthorize("hasAnyRole('ADMIN', 'PRO')")
    @Operation(summary = "Get message by ID", description = "Retrieves a single message by its ID")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Message found",
                    content = @Content(schema = @Schema(implementation = MessageResponse.class))),
            @ApiResponse(responseCode = "404", description = "Message not found",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    })
    public ResponseEntity<MessageResponse> getById(
            @Parameter(description = "ID of the message to retrieve", required = true)
            @PathVariable Long id) {
        try {
            MessageResponse response = messageService.getById(id);
            return ResponseEntity.ok(response);
        } catch (EntityNotFoundException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'PRO')")
    @Operation(summary = "List messages", description = "Retrieves a paginated list of messages with optional filtering by dossier, channel, direction, and date range. Results are sorted by timestamp in descending order by default.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Messages retrieved successfully",
                    content = @Content(schema = @Schema(implementation = Page.class)))
    })
    public ResponseEntity<Page<MessageResponse>> list(
            @Parameter(description = "Filter by dossier ID", required = true)
            @RequestParam Long dossierId,
            @Parameter(description = "Filter by message channel")
            @RequestParam(required = false) MessageChannel channel,
            @Parameter(description = "Filter by message direction")
            @RequestParam(required = false) MessageDirection direction,
            @Parameter(description = "Filter by start date (ISO format)")
            @RequestParam(required = false) @org.springframework.format.annotation.DateTimeFormat(iso = org.springframework.format.annotation.DateTimeFormat.ISO.DATE_TIME) java.time.LocalDateTime startDate,
            @Parameter(description = "Filter by end date (ISO format)")
            @RequestParam(required = false) @org.springframework.format.annotation.DateTimeFormat(iso = org.springframework.format.annotation.DateTimeFormat.ISO.DATE_TIME) java.time.LocalDateTime endDate,
            @Parameter(description = "Page number (0-indexed)")
            @RequestParam(defaultValue = "0") int page,
            @Parameter(description = "Page size")
            @RequestParam(defaultValue = "20") int size,
            @Parameter(description = "Sort criteria in format: property(,asc|desc). Default sort order is descending. Multiple sort criteria are supported.")
            @RequestParam(defaultValue = "timestamp,desc") String sort) {

        Pageable pageable = createPageable(page, size, sort);
        Page<MessageResponse> response = messageService.listByDossier(dossierId, channel, direction, startDate, endDate, pageable);
        return ResponseEntity.ok(response);
    }

    private Pageable createPageable(int page, int size, String sort) {
        String[] sortParams = sort.split(",");
        String property = sortParams[0];
        Sort.Direction direction = sortParams.length > 1 && sortParams[1].equalsIgnoreCase("desc")
                ? Sort.Direction.DESC
                : Sort.Direction.ASC;
        return PageRequest.of(page, size, Sort.by(direction, property));
    }
}
