package com.example.backend.service;

import com.example.backend.dto.LeadImportResponse;
import com.example.backend.dto.LeadImportRow;
import com.example.backend.entity.Dossier;
import com.example.backend.entity.ImportJobEntity;
import com.example.backend.entity.enums.DossierSource;
import com.example.backend.entity.enums.DossierStatus;
import com.example.backend.entity.enums.ImportJobStatus;
import com.example.backend.entity.enums.MergeStrategy;
import com.example.backend.repository.DossierRepository;
import com.example.backend.repository.ImportJobRepository;
import com.example.backend.util.TenantContext;
import com.opencsv.bean.CsvToBean;
import com.opencsv.bean.CsvToBeanBuilder;
import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

@Service
public class LeadImportService {

    private final DossierRepository dossierRepository;
    private final ImportJobRepository importJobRepository;

    public LeadImportService(
            DossierRepository dossierRepository, ImportJobRepository importJobRepository) {
        this.dossierRepository = dossierRepository;
        this.importJobRepository = importJobRepository;
    }

    @Transactional
    public LeadImportResponse importLeads(MultipartFile file, MergeStrategy mergeStrategy) {
        String orgId = TenantContext.getOrgId();
        if (orgId == null) {
            throw new IllegalStateException("Organization ID not found in context");
        }

        ImportJobEntity importJob = new ImportJobEntity();
        importJob.setOrgId(orgId);
        importJob.setFilename(file.getOriginalFilename());
        importJob.setStatus(ImportJobStatus.IN_PROGRESS);
        importJob = importJobRepository.save(importJob);

        LeadImportResponse response = new LeadImportResponse();
        response.setImportJobId(importJob.getId());

        try {
            BufferedReader reader =
                    new BufferedReader(
                            new InputStreamReader(file.getInputStream(), StandardCharsets.UTF_8));

            CsvToBean<LeadImportRow> csvToBean =
                    new CsvToBeanBuilder<LeadImportRow>(reader)
                            .withType(LeadImportRow.class)
                            .withIgnoreLeadingWhiteSpace(true)
                            .withIgnoreEmptyLine(true)
                            .build();

            List<LeadImportRow> rows = csvToBean.parse();
            int totalRows = rows.size();
            int successCount = 0;
            int errorCount = 0;
            int skippedCount = 0;
            StringBuilder errorReport = new StringBuilder();

            for (int i = 0; i < rows.size(); i++) {
                LeadImportRow row = rows.get(i);
                int rowNumber = i + 2;

                try {
                    if (!validateRow(row, rowNumber, response)) {
                        errorCount++;
                        errorReport.append(
                                String.format("Row %d: Validation failed - ", rowNumber));
                        errorReport.append(getValidationErrors(row)).append("\n");
                        continue;
                    }

                    List<Dossier> existingDossiers =
                            dossierRepository.findByLeadPhoneAndOrgIdAndStatusNotIn(
                                    row.getPhone(),
                                    orgId,
                                    Arrays.asList(DossierStatus.LOST, DossierStatus.WON));

                    if (!existingDossiers.isEmpty()) {
                        if (mergeStrategy == MergeStrategy.SKIP) {
                            skippedCount++;
                            errorReport.append(
                                    String.format(
                                            "Row %d: Duplicate phone number - skipped\n",
                                            rowNumber));
                            continue;
                        } else if (mergeStrategy == MergeStrategy.OVERWRITE) {
                            Dossier existingDossier = existingDossiers.get(0);
                            updateDossierFromRow(existingDossier, row);
                            dossierRepository.save(existingDossier);
                            successCount++;
                            continue;
                        }
                    }

                    Dossier dossier = createDossierFromRow(row, orgId);
                    dossierRepository.save(dossier);
                    successCount++;

                } catch (Exception e) {
                    errorCount++;
                    errorReport.append(String.format("Row %d: %s\n", rowNumber, e.getMessage()));
                    response.addValidationError(rowNumber, "general", e.getMessage());
                }
            }

            response.setTotalRows(totalRows);
            response.setSuccessCount(successCount);
            response.setErrorCount(errorCount);
            response.setSkippedCount(skippedCount);

            importJob.setTotalRows(totalRows);
            importJob.setSuccessCount(successCount);
            importJob.setErrorCount(errorCount);
            importJob.setSkippedCount(skippedCount);
            importJob.setErrorReport(errorReport.toString());
            importJob.setStatus(ImportJobStatus.COMPLETED);
            importJobRepository.save(importJob);

        } catch (Exception e) {
            importJob.setStatus(ImportJobStatus.FAILED);
            importJob.setErrorReport("Failed to process file: " + e.getMessage());
            importJobRepository.save(importJob);
            throw new RuntimeException("Failed to import leads: " + e.getMessage(), e);
        }

        return response;
    }

    private boolean validateRow(LeadImportRow row, int rowNumber, LeadImportResponse response) {
        boolean valid = true;

        if (row.getName() == null || row.getName().trim().isEmpty()) {
            response.addValidationError(rowNumber, "name", "Name is required");
            valid = false;
        }

        if (row.getPhone() == null || row.getPhone().trim().isEmpty()) {
            response.addValidationError(rowNumber, "phone", "Phone is required");
            valid = false;
        }

        if (row.getSource() == null || row.getSource().trim().isEmpty()) {
            response.addValidationError(rowNumber, "source", "Source is required");
            valid = false;
        } else {
            try {
                DossierSource.fromValue(row.getSource().toLowerCase());
            } catch (IllegalArgumentException e) {
                response.addValidationError(
                        rowNumber, "source", "Invalid source value: " + row.getSource());
                valid = false;
            }
        }

        if (row.getScore() != null && !row.getScore().trim().isEmpty()) {
            try {
                int score = Integer.parseInt(row.getScore());
                if (score < 0 || score > 100) {
                    response.addValidationError(
                            rowNumber, "score", "Score must be between 0 and 100");
                    valid = false;
                }
            } catch (NumberFormatException e) {
                response.addValidationError(rowNumber, "score", "Score must be a valid number");
                valid = false;
            }
        }

        return valid;
    }

    private String getValidationErrors(LeadImportRow row) {
        StringBuilder errors = new StringBuilder();
        if (row.getName() == null || row.getName().trim().isEmpty()) {
            errors.append("Name is required. ");
        }
        if (row.getPhone() == null || row.getPhone().trim().isEmpty()) {
            errors.append("Phone is required. ");
        }
        if (row.getSource() == null || row.getSource().trim().isEmpty()) {
            errors.append("Source is required. ");
        }
        return errors.toString().trim();
    }

    private Dossier createDossierFromRow(LeadImportRow row, String orgId) {
        Dossier dossier = new Dossier();
        dossier.setOrgId(orgId);
        dossier.setLeadName(row.getName());
        dossier.setLeadPhone(row.getPhone());
        dossier.setLeadEmail(row.getEmail());
        dossier.setSource(DossierSource.fromValue(row.getSource().toLowerCase()));
        dossier.setLeadSource(row.getLeadSource());
        dossier.setNotes(row.getNotes());
        dossier.setStatus(DossierStatus.NEW);

        if (row.getScore() != null && !row.getScore().trim().isEmpty()) {
            try {
                dossier.setScore(Integer.parseInt(row.getScore()));
            } catch (NumberFormatException ignored) {
            }
        }

        LocalDateTime now = LocalDateTime.now();
        dossier.setCreatedAt(now);
        dossier.setUpdatedAt(now);

        return dossier;
    }

    private void updateDossierFromRow(Dossier dossier, LeadImportRow row) {
        dossier.setLeadName(row.getName());
        dossier.setLeadEmail(row.getEmail());
        dossier.setSource(DossierSource.fromValue(row.getSource().toLowerCase()));
        dossier.setLeadSource(row.getLeadSource());
        dossier.setNotes(row.getNotes());

        if (row.getScore() != null && !row.getScore().trim().isEmpty()) {
            try {
                dossier.setScore(Integer.parseInt(row.getScore()));
            } catch (NumberFormatException ignored) {
            }
        }

        dossier.setUpdatedAt(LocalDateTime.now());
    }
}
