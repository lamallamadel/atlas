package com.example.backend.service;

import com.example.backend.entity.Dossier;
import com.example.backend.entity.enums.DossierSource;
import com.example.backend.entity.enums.DossierStatus;
import com.example.backend.repository.DossierRepository;
import com.example.backend.util.TenantContext;
import com.opencsv.CSVWriter;
import jakarta.persistence.criteria.Predicate;
import java.io.IOException;
import java.io.Writer;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;

@Service
public class LeadExportService {

    private final DossierRepository dossierRepository;
    private static final DateTimeFormatter DATE_FORMATTER =
            DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");

    public LeadExportService(DossierRepository dossierRepository) {
        this.dossierRepository = dossierRepository;
    }

    public void exportLeads(
            Writer writer,
            DossierStatus status,
            LocalDateTime startDate,
            LocalDateTime endDate,
            DossierSource source,
            List<String> columns)
            throws IOException {
        String orgId = TenantContext.getOrgId();
        if (orgId == null) {
            throw new IllegalStateException("Organization ID not found in context");
        }

        Specification<Dossier> spec = buildSpecification(orgId, status, startDate, endDate, source);
        List<Dossier> dossiers = dossierRepository.findAll(spec);

        List<String> selectedColumns =
                columns != null && !columns.isEmpty() ? columns : getDefaultColumns();

        try (CSVWriter csvWriter =
                new CSVWriter(
                        writer,
                        CSVWriter.DEFAULT_SEPARATOR,
                        CSVWriter.DEFAULT_QUOTE_CHARACTER,
                        CSVWriter.DEFAULT_ESCAPE_CHARACTER,
                        CSVWriter.DEFAULT_LINE_END)) {

            String[] header = selectedColumns.toArray(new String[0]);
            csvWriter.writeNext(header);

            for (Dossier dossier : dossiers) {
                String[] row = buildRow(dossier, selectedColumns);
                csvWriter.writeNext(row);
            }
        }
    }

    private Specification<Dossier> buildSpecification(
            String orgId,
            DossierStatus status,
            LocalDateTime startDate,
            LocalDateTime endDate,
            DossierSource source) {
        return (root, query, criteriaBuilder) -> {
            List<Predicate> predicates = new ArrayList<>();

            predicates.add(criteriaBuilder.equal(root.get("orgId"), orgId));

            if (status != null) {
                predicates.add(criteriaBuilder.equal(root.get("status"), status));
            }

            if (startDate != null) {
                predicates.add(
                        criteriaBuilder.greaterThanOrEqualTo(root.get("createdAt"), startDate));
            }

            if (endDate != null) {
                predicates.add(criteriaBuilder.lessThanOrEqualTo(root.get("createdAt"), endDate));
            }

            if (source != null) {
                predicates.add(criteriaBuilder.equal(root.get("source"), source));
            }

            return criteriaBuilder.and(predicates.toArray(new Predicate[0]));
        };
    }

    private List<String> getDefaultColumns() {
        return Arrays.asList(
                "id",
                "name",
                "phone",
                "email",
                "source",
                "lead_source",
                "status",
                "score",
                "notes",
                "created_at",
                "updated_at");
    }

    private String[] buildRow(Dossier dossier, List<String> columns) {
        List<String> values = new ArrayList<>();

        for (String column : columns) {
            String value = "";
            switch (column.toLowerCase()) {
                case "id":
                    value = dossier.getId() != null ? dossier.getId().toString() : "";
                    break;
                case "name":
                    value = dossier.getLeadName() != null ? dossier.getLeadName() : "";
                    break;
                case "phone":
                    value = dossier.getLeadPhone() != null ? dossier.getLeadPhone() : "";
                    break;
                case "email":
                    value = dossier.getLeadEmail() != null ? dossier.getLeadEmail() : "";
                    break;
                case "source":
                    value = dossier.getSource() != null ? dossier.getSource().getValue() : "";
                    break;
                case "lead_source":
                    value = dossier.getLeadSource() != null ? dossier.getLeadSource() : "";
                    break;
                case "status":
                    value = dossier.getStatus() != null ? dossier.getStatus().name() : "";
                    break;
                case "score":
                    value = dossier.getScore() != null ? dossier.getScore().toString() : "";
                    break;
                case "notes":
                    value = dossier.getNotes() != null ? dossier.getNotes() : "";
                    break;
                case "created_at":
                    value =
                            dossier.getCreatedAt() != null
                                    ? dossier.getCreatedAt().format(DATE_FORMATTER)
                                    : "";
                    break;
                case "updated_at":
                    value =
                            dossier.getUpdatedAt() != null
                                    ? dossier.getUpdatedAt().format(DATE_FORMATTER)
                                    : "";
                    break;
                case "created_by":
                    value = dossier.getCreatedBy() != null ? dossier.getCreatedBy() : "";
                    break;
                case "updated_by":
                    value = dossier.getUpdatedBy() != null ? dossier.getUpdatedBy() : "";
                    break;
                case "annonce_id":
                    value = dossier.getAnnonceId() != null ? dossier.getAnnonceId().toString() : "";
                    break;
                case "case_type":
                    value = dossier.getCaseType() != null ? dossier.getCaseType() : "";
                    break;
                case "status_code":
                    value = dossier.getStatusCode() != null ? dossier.getStatusCode() : "";
                    break;
                case "loss_reason":
                    value = dossier.getLossReason() != null ? dossier.getLossReason() : "";
                    break;
                case "won_reason":
                    value = dossier.getWonReason() != null ? dossier.getWonReason() : "";
                    break;
                default:
                    value = "";
            }
            values.add(value);
        }

        return values.toArray(new String[0]);
    }
}
