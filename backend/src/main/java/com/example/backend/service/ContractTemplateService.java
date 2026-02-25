package com.example.backend.service;

import com.example.backend.dto.ContractTemplateRequest;
import com.example.backend.entity.ContractTemplateEntity;
import com.example.backend.repository.ContractTemplateRepository;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.List;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

@Service
public class ContractTemplateService {

    private final ContractTemplateRepository contractTemplateRepository;
    private static final String TEMPLATE_STORAGE_DIR = "contract-templates";

    public ContractTemplateService(ContractTemplateRepository contractTemplateRepository) {
        this.contractTemplateRepository = contractTemplateRepository;
    }

    @Transactional
    public ContractTemplateEntity uploadTemplate(
            ContractTemplateRequest request, MultipartFile file, String orgId, String userId)
            throws IOException {

        String fileName = file.getOriginalFilename();
        String uniqueFileName = UUID.randomUUID() + "_" + fileName;
        String storagePath = TEMPLATE_STORAGE_DIR + "/" + orgId + "/" + uniqueFileName;

        Path uploadPath = Paths.get(TEMPLATE_STORAGE_DIR, orgId);
        if (!Files.exists(uploadPath)) {
            Files.createDirectories(uploadPath);
        }

        Path filePath = uploadPath.resolve(uniqueFileName);
        Files.copy(file.getInputStream(), filePath, StandardCopyOption.REPLACE_EXISTING);

        ContractTemplateEntity template = new ContractTemplateEntity();
        template.setOrgId(orgId);
        template.setCreatedBy(userId);
        template.setTemplateName(request.getTemplateName());
        template.setTemplateType(request.getTemplateType());
        template.setDescription(request.getDescription());
        template.setFileName(fileName);
        template.setStoragePath(storagePath);
        template.setFileSize(file.getSize());
        template.setSignatureFields(request.getSignatureFields());
        template.setIsActive(request.getIsActive());

        return contractTemplateRepository.save(template);
    }

    public List<ContractTemplateEntity> getActiveTemplates(String orgId) {
        return contractTemplateRepository.findByOrgIdAndIsActiveTrue(orgId);
    }

    public List<ContractTemplateEntity> getTemplatesByType(String orgId, String templateType) {
        return contractTemplateRepository.findByOrgIdAndTemplateType(orgId, templateType);
    }

    public ContractTemplateEntity getTemplate(Long id, String orgId) {
        return contractTemplateRepository
                .findByIdAndOrgId(id, orgId)
                .orElseThrow(() -> new IllegalArgumentException("Template not found"));
    }

    @Transactional
    public ContractTemplateEntity updateTemplate(
            Long id, ContractTemplateRequest request, String orgId) {
        ContractTemplateEntity template =
                contractTemplateRepository
                        .findByIdAndOrgId(id, orgId)
                        .orElseThrow(() -> new IllegalArgumentException("Template not found"));

        template.setTemplateName(request.getTemplateName());
        template.setTemplateType(request.getTemplateType());
        template.setDescription(request.getDescription());
        template.setSignatureFields(request.getSignatureFields());
        template.setIsActive(request.getIsActive());

        return contractTemplateRepository.save(template);
    }

    @Transactional
    public void deleteTemplate(Long id, String orgId) {
        ContractTemplateEntity template =
                contractTemplateRepository
                        .findByIdAndOrgId(id, orgId)
                        .orElseThrow(() -> new IllegalArgumentException("Template not found"));

        template.setIsActive(false);
        contractTemplateRepository.save(template);
    }
}
