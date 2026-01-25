package com.example.backend.controller;

import com.example.backend.dto.SearchResponseDto;
import com.example.backend.service.SearchService;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.lang.Nullable;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/search")
@Tag(name = "Search", description = "Search API for Annonces and Dossiers")
public class SearchController {

    @Autowired(required = false)
    @Nullable
    private SearchService searchService;

    private final ObjectMapper objectMapper = new ObjectMapper();

    @GetMapping
    @Operation(summary = "Search across Annonces and Dossiers", 
               description = "Performs full-text search with fuzzy matching and relevance scoring. Falls back to PostgreSQL when Elasticsearch is unavailable.")
    public ResponseEntity<SearchResponseDto> search(
            @Parameter(description = "Search query string") 
            @RequestParam(required = false) String q,
            
            @Parameter(description = "Filter by type: 'annonce' or 'dossier'. Omit for all types.") 
            @RequestParam(required = false) String type,
            
            @Parameter(description = "JSON-encoded filters object. Example: {\"status\":\"ACTIVE\",\"city\":\"Paris\"}") 
            @RequestParam(required = false) String filters,
            
            @Parameter(description = "Page number (0-based)") 
            @RequestParam(defaultValue = "0") int page,
            
            @Parameter(description = "Page size") 
            @RequestParam(defaultValue = "10") int size
    ) {
        if (searchService == null) {
            return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE).build();
        }

        Map<String, Object> filterMap = new HashMap<>();
        
        if (filters != null && !filters.isBlank()) {
            try {
                filterMap = objectMapper.readValue(filters, new TypeReference<Map<String, Object>>() {});
            } catch (Exception e) {
                return ResponseEntity.badRequest().build();
            }
        }

        SearchResponseDto results = searchService.search(q, type, filterMap, page, size);
        return ResponseEntity.ok(results);
    }

    @GetMapping("/autocomplete")
    @Operation(summary = "Autocomplete search", 
               description = "Returns top 5 search results for autocomplete functionality")
    public ResponseEntity<SearchResponseDto> autocomplete(
            @Parameter(description = "Search query string") 
            @RequestParam String q,
            
            @Parameter(description = "Filter by type: 'annonce' or 'dossier'") 
            @RequestParam(required = false) String type
    ) {
        if (searchService == null) {
            return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE).build();
        }

        SearchResponseDto results = searchService.search(q, type, null, 0, 5);
        return ResponseEntity.ok(results);
    }
}
