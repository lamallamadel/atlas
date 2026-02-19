package com.example.backend.controller;

import com.example.backend.util.DatabaseIndexAudit;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import java.util.List;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/performance")
@Tag(name = "Performance", description = "Performance optimization and diagnostics")
public class PerformanceController {

    private final DatabaseIndexAudit databaseIndexAudit;

    public PerformanceController(DatabaseIndexAudit databaseIndexAudit) {
        this.databaseIndexAudit = databaseIndexAudit;
    }

    @GetMapping("/index-audit")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(
            summary = "Audit database indexes",
            description = "Check for missing indexes on frequently used columns")
    public ResponseEntity<List<DatabaseIndexAudit.IndexRecommendation>> auditIndexes() {
        List<DatabaseIndexAudit.IndexRecommendation> recommendations =
                databaseIndexAudit.auditMissingIndexes();
        return ResponseEntity.ok(recommendations);
    }
}
