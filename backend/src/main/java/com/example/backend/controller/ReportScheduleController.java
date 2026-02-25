package com.example.backend.controller;

import com.example.backend.dto.ReportScheduleDto;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/report-schedules")
@Tag(
        name = "Report Schedules",
        description = "API for managing scheduled reports with automated email delivery")
public class ReportScheduleController {

    private final Map<Long, ReportScheduleDto> schedules = new HashMap<>();
    private Long nextId = 1L;

    @PostMapping
    @Operation(
            summary = "Create report schedule",
            description = "Create a new scheduled report with daily/weekly/monthly frequency")
    @ApiResponses(
            value = {
                @ApiResponse(
                        responseCode = "201",
                        description = "Schedule created successfully",
                        content =
                                @Content(
                                        schema =
                                                @Schema(implementation = ReportScheduleDto.class))),
                @ApiResponse(responseCode = "400", description = "Invalid schedule configuration")
            })
    public ResponseEntity<ReportScheduleDto> createSchedule(
            @RequestBody ReportScheduleDto schedule) {
        schedule.setId(nextId++);
        schedule.setNextRunDate(LocalDateTime.now().plusDays(1));
        schedules.put(schedule.getId(), schedule);
        return ResponseEntity.status(HttpStatus.CREATED).body(schedule);
    }

    @PutMapping("/{id}")
    @Operation(
            summary = "Update report schedule",
            description = "Update an existing scheduled report")
    @ApiResponses(
            value = {
                @ApiResponse(responseCode = "200", description = "Schedule updated successfully"),
                @ApiResponse(responseCode = "404", description = "Schedule not found")
            })
    public ResponseEntity<ReportScheduleDto> updateSchedule(
            @PathVariable Long id, @RequestBody ReportScheduleDto schedule) {
        if (!schedules.containsKey(id)) {
            return ResponseEntity.notFound().build();
        }
        schedule.setId(id);
        schedules.put(id, schedule);
        return ResponseEntity.ok(schedule);
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Delete report schedule", description = "Delete a scheduled report")
    @ApiResponses(
            value = {
                @ApiResponse(responseCode = "204", description = "Schedule deleted successfully"),
                @ApiResponse(responseCode = "404", description = "Schedule not found")
            })
    public ResponseEntity<Void> deleteSchedule(@PathVariable Long id) {
        if (!schedules.containsKey(id)) {
            return ResponseEntity.notFound().build();
        }
        schedules.remove(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/{id}")
    @Operation(
            summary = "Get report schedule",
            description = "Get details of a specific scheduled report")
    @ApiResponses(
            value = {
                @ApiResponse(responseCode = "200", description = "Schedule retrieved successfully"),
                @ApiResponse(responseCode = "404", description = "Schedule not found")
            })
    public ResponseEntity<ReportScheduleDto> getSchedule(@PathVariable Long id) {
        ReportScheduleDto schedule = schedules.get(id);
        if (schedule == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(schedule);
    }

    @GetMapping
    @Operation(summary = "List report schedules", description = "Get all scheduled reports")
    @ApiResponses(
            value = {
                @ApiResponse(responseCode = "200", description = "Schedules retrieved successfully")
            })
    public ResponseEntity<List<ReportScheduleDto>> listSchedules() {
        return ResponseEntity.ok(new ArrayList<>(schedules.values()));
    }

    @PostMapping("/{id}/enable")
    @Operation(
            summary = "Enable report schedule",
            description = "Enable a disabled scheduled report")
    @ApiResponses(
            value = {
                @ApiResponse(responseCode = "200", description = "Schedule enabled successfully"),
                @ApiResponse(responseCode = "404", description = "Schedule not found")
            })
    public ResponseEntity<Void> enableSchedule(@PathVariable Long id) {
        ReportScheduleDto schedule = schedules.get(id);
        if (schedule == null) {
            return ResponseEntity.notFound().build();
        }
        schedule.setEnabled(true);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/{id}/disable")
    @Operation(summary = "Disable report schedule", description = "Disable a scheduled report")
    @ApiResponses(
            value = {
                @ApiResponse(responseCode = "200", description = "Schedule disabled successfully"),
                @ApiResponse(responseCode = "404", description = "Schedule not found")
            })
    public ResponseEntity<Void> disableSchedule(@PathVariable Long id) {
        ReportScheduleDto schedule = schedules.get(id);
        if (schedule == null) {
            return ResponseEntity.notFound().build();
        }
        schedule.setEnabled(false);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/{id}/execute")
    @Operation(
            summary = "Execute report now",
            description = "Execute a scheduled report immediately")
    @ApiResponses(
            value = {
                @ApiResponse(responseCode = "200", description = "Report executed successfully"),
                @ApiResponse(responseCode = "404", description = "Schedule not found")
            })
    public ResponseEntity<Map<String, Object>> executeNow(@PathVariable Long id) {
        ReportScheduleDto schedule = schedules.get(id);
        if (schedule == null) {
            return ResponseEntity.notFound().build();
        }

        Map<String, Object> execution = new HashMap<>();
        execution.put("id", System.currentTimeMillis());
        execution.put("scheduleId", id);
        execution.put("executionDate", LocalDateTime.now().toString());
        execution.put("status", "completed");
        execution.put("recipientCount", schedule.getRecipients().size());

        schedule.setLastRunDate(LocalDateTime.now());

        return ResponseEntity.ok(execution);
    }

    @GetMapping("/{scheduleId}/executions")
    @Operation(
            summary = "Get execution history",
            description = "Get execution history for a scheduled report")
    @ApiResponses(
            value = {
                @ApiResponse(
                        responseCode = "200",
                        description = "Execution history retrieved successfully"),
                @ApiResponse(responseCode = "404", description = "Schedule not found")
            })
    public ResponseEntity<List<Map<String, Object>>> getExecutionHistory(
            @PathVariable Long scheduleId) {
        if (!schedules.containsKey(scheduleId)) {
            return ResponseEntity.notFound().build();
        }

        List<Map<String, Object>> executions = new ArrayList<>();
        for (int i = 0; i < 5; i++) {
            Map<String, Object> execution = new HashMap<>();
            execution.put("id", i + 1);
            execution.put("scheduleId", scheduleId);
            execution.put("executionDate", LocalDateTime.now().minusDays(i).toString());
            execution.put("status", "completed");
            execution.put("recipientCount", 3);
            executions.add(execution);
        }

        return ResponseEntity.ok(executions);
    }
}
