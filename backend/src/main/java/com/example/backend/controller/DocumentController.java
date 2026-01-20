package com.example.backend.controller;

import com.example.backend.dto.DocumentResponse;
import com.example.backend.exception.ErrorResponse;
import com.example.backend.service.DocumentService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.core.io.InputStreamResource;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.InputStream;

@RestController
@RequestMapping("/api/v1/documents")
@Tag(name = "Documents", description = "API for managing documents and file uploads")
public class DocumentController {

    private final DocumentService documentService;

    public DocumentController(DocumentService documentService) {
        this.documentService = documentService;
    }

    @PostMapping(value = "/upload", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasAnyRole('ADMIN', 'PRO')")
    @Operation(summary = "Upload a document", description = "Uploads a document file and associates it with a dossier")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "201", description = "Document uploaded successfully",
                    content = @Content(schema = @Schema(implementation = DocumentResponse.class))),
            @ApiResponse(responseCode = "400", description = "Invalid file or request",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class))),
            @ApiResponse(responseCode = "404", description = "Dossier not found",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    })
    public ResponseEntity<DocumentResponse> upload(
            @Parameter(description = "ID of the dossier to associate the document with", required = true)
            @RequestParam("dossierId") Long dossierId,
            @Parameter(description = "File to upload", required = true)
            @RequestParam("file") MultipartFile file,
            @Parameter(description = "Document category (Contract, Invoice, ID, Photo, Other)")
            @RequestParam(value = "category", required = false) String category) {
        DocumentResponse response = documentService.upload(dossierId, file, category);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping("/{id}/download")
    @PreAuthorize("hasAnyRole('ADMIN', 'PRO')")
    @Operation(summary = "Download a document", description = "Downloads a document file by its ID")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Document downloaded successfully"),
            @ApiResponse(responseCode = "404", description = "Document not found",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    })
    public ResponseEntity<InputStreamResource> download(
            @Parameter(description = "ID of the document to download", required = true)
            @PathVariable Long id) {
        DocumentResponse document = documentService.getById(id);
        InputStream inputStream = documentService.download(id);

        HttpHeaders headers = new HttpHeaders();
        headers.add(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + document.getFileName() + "\"");
        headers.setContentType(MediaType.parseMediaType(document.getContentType()));

        return ResponseEntity.ok()
                .headers(headers)
                .contentLength(document.getFileSize())
                .body(new InputStreamResource(inputStream));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'PRO')")
    @Operation(summary = "Get document metadata", description = "Retrieves metadata for a document by its ID")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Document metadata retrieved successfully",
                    content = @Content(schema = @Schema(implementation = DocumentResponse.class))),
            @ApiResponse(responseCode = "404", description = "Document not found",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    })
    public ResponseEntity<DocumentResponse> getById(
            @Parameter(description = "ID of the document", required = true)
            @PathVariable Long id) {
        DocumentResponse response = documentService.getById(id);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/dossier/{dossierId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'PRO')")
    @Operation(
            summary = "List documents by dossier",
            description = "Retrieves a paginated list of documents for a specific dossier. " +
                    "Example: GET /api/v1/documents/dossier/123?page=0&size=20&sort=createdAt,desc"
    )
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Documents retrieved successfully",
                    content = @Content(schema = @Schema(implementation = Page.class))),
            @ApiResponse(responseCode = "404", description = "Dossier not found",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    })
    public ResponseEntity<Page<DocumentResponse>> listByDossier(
            @Parameter(description = "ID of the dossier", required = true)
            @PathVariable Long dossierId,
            @Parameter(description = "Page number (0-indexed)")
            @RequestParam(defaultValue = "0") int page,
            @Parameter(description = "Page size (min=1, default=20)", example = "20")
            @RequestParam(defaultValue = "20") int size,
            @Parameter(description = "Sort criteria in format: property(,asc|desc). Default sort order is descending by createdAt.")
            @RequestParam(defaultValue = "createdAt,desc") String sort) {

        if (page < 0) {
            throw new IllegalArgumentException("Page number must be at least 0");
        }
        if (size < 1) {
            throw new IllegalArgumentException("Page size must be at least 1");
        }

        Pageable pageable = createPageable(page, size, sort);
        Page<DocumentResponse> response = documentService.listByDossier(dossierId, pageable);
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'PRO')")
    @Operation(summary = "Delete a document", description = "Deletes a document and its associated file")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "204", description = "Document deleted successfully",
                    content = @Content),
            @ApiResponse(responseCode = "404", description = "Document not found",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    })
    public ResponseEntity<Void> delete(
            @Parameter(description = "ID of the document to delete", required = true)
            @PathVariable Long id) {
        documentService.delete(id);
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
