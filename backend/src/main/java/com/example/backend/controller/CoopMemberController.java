package com.example.backend.controller;

import com.example.backend.dto.CoopMemberRequest;
import com.example.backend.dto.CoopMemberResponse;
import com.example.backend.entity.enums.MemberStatus;
import com.example.backend.service.CoopMemberService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
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
@RequestMapping("/api/v1/coop/members")
@Tag(name = "Coop Members", description = "API for managing cooperative housing members")
public class CoopMemberController {

    private final CoopMemberService coopMemberService;

    public CoopMemberController(CoopMemberService coopMemberService) {
        this.coopMemberService = coopMemberService;
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Create a new cooperative member")
    public ResponseEntity<CoopMemberResponse> create(@Valid @RequestBody CoopMemberRequest request) {
        CoopMemberResponse response = coopMemberService.create(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'PRO')")
    @Operation(summary = "Get cooperative member by ID")
    public ResponseEntity<CoopMemberResponse> getById(@PathVariable Long id) {
        CoopMemberResponse response = coopMemberService.getById(id);
        return ResponseEntity.ok(response);
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'PRO')")
    @Operation(summary = "List cooperative members")
    public ResponseEntity<Page<CoopMemberResponse>> list(
            @RequestParam(required = false) Long groupId,
            @RequestParam(required = false) MemberStatus status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "id,asc") String sort) {
        Pageable pageable = createPageable(page, size, sort);
        Page<CoopMemberResponse> response = coopMemberService.list(groupId, status, pageable);
        return ResponseEntity.ok(response);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Update cooperative member")
    public ResponseEntity<CoopMemberResponse> update(
            @PathVariable Long id,
            @Valid @RequestBody CoopMemberRequest request) {
        CoopMemberResponse response = coopMemberService.update(id, request);
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Delete cooperative member")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        coopMemberService.delete(id);
        return ResponseEntity.noContent().build();
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
