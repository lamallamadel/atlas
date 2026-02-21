package com.example.backend.service;

import com.example.backend.dto.ReferentialTemplateDto;
import com.example.backend.entity.ReferentialEntity;
import com.example.backend.repository.ReferentialRepository;
import com.example.backend.util.TenantContext;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ReferentialTemplateService {

    private static final Logger log = LoggerFactory.getLogger(ReferentialTemplateService.class);

    private final ReferentialRepository referentialRepository;

    public ReferentialTemplateService(ReferentialRepository referentialRepository) {
        this.referentialRepository = referentialRepository;
    }

    @Transactional(readOnly = true)
    public ReferentialTemplateDto exportTemplate(List<String> categories) {
        String orgId = TenantContext.getOrgId();
        if (orgId == null) {
            throw new IllegalStateException("Organization ID not found in context");
        }

        log.info(
                "Exporting referential template for org: {} with categories: {}",
                orgId,
                categories);

        ReferentialTemplateDto template = new ReferentialTemplateDto();
        template.setTemplateName("Referential Export - " + orgId);
        template.setTemplateDescription("Exported referential values");
        template.setVersion("1.0");

        List<ReferentialTemplateDto.ReferentialTemplateItem> items = new ArrayList<>();

        for (String category : categories) {
            List<ReferentialEntity> referentials =
                    referentialRepository.findByCategoryOrderByDisplayOrderAsc(category);

            items.addAll(
                    referentials.stream().map(this::toTemplateItem).collect(Collectors.toList()));
        }

        template.setItems(items);

        log.info("Exported {} referential items", items.size());

        return template;
    }

    @Transactional(readOnly = true)
    public ReferentialTemplateDto exportAllCategories() {
        List<String> categories =
                List.of("CASE_TYPE", "CASE_STATUS", "LEAD_SOURCE", "LOSS_REASON", "WON_REASON");
        return exportTemplate(categories);
    }

    @Transactional
    public int importTemplate(ReferentialTemplateDto template, boolean overwriteExisting) {
        String orgId = TenantContext.getOrgId();
        if (orgId == null) {
            throw new IllegalStateException("Organization ID not found in context");
        }

        log.info(
                "Importing referential template '{}' for org: {}, overwrite: {}",
                template.getTemplateName(),
                orgId,
                overwriteExisting);

        int importedCount = 0;

        for (ReferentialTemplateDto.ReferentialTemplateItem item : template.getItems()) {
            boolean exists =
                    referentialRepository.existsByCategoryAndCode(
                            item.getCategory(), item.getCode());

            if (exists && !overwriteExisting) {
                log.debug(
                        "Skipping existing referential: {}/{}", item.getCategory(), item.getCode());
                continue;
            }

            if (exists && overwriteExisting) {
                ReferentialEntity existing =
                        referentialRepository
                                .findByCategoryAndCode(item.getCategory(), item.getCode())
                                .orElseThrow();

                if (!existing.getIsSystem()) {
                    existing.setLabel(item.getLabel());
                    existing.setDescription(item.getDescription());
                    existing.setDisplayOrder(item.getDisplayOrder());
                    existing.setIsActive(item.getIsActive() != null ? item.getIsActive() : true);
                    existing.setVersion(existing.getVersion() + 1);
                    existing.setLastChangeType("UPDATED");
                    referentialRepository.save(existing);
                    importedCount++;
                    log.debug("Updated referential: {}/{}", item.getCategory(), item.getCode());
                }
            } else {
                ReferentialEntity newRef = fromTemplateItem(item, orgId);
                referentialRepository.save(newRef);
                importedCount++;
                log.debug("Created referential: {}/{}", item.getCategory(), item.getCode());
            }
        }

        log.info("Imported {} referential items", importedCount);

        return importedCount;
    }

    private ReferentialTemplateDto.ReferentialTemplateItem toTemplateItem(
            ReferentialEntity entity) {
        ReferentialTemplateDto.ReferentialTemplateItem item =
                new ReferentialTemplateDto.ReferentialTemplateItem();
        item.setCategory(entity.getCategory());
        item.setCode(entity.getCode());
        item.setLabel(entity.getLabel());
        item.setDescription(entity.getDescription());
        item.setDisplayOrder(entity.getDisplayOrder());
        item.setIsActive(entity.getIsActive());
        return item;
    }

    private ReferentialEntity fromTemplateItem(
            ReferentialTemplateDto.ReferentialTemplateItem item, String orgId) {
        ReferentialEntity entity = new ReferentialEntity();
        entity.setOrgId(orgId);
        entity.setCategory(item.getCategory());
        entity.setCode(item.getCode());
        entity.setLabel(item.getLabel());
        entity.setDescription(item.getDescription());
        entity.setDisplayOrder(item.getDisplayOrder());
        entity.setIsActive(item.getIsActive() != null ? item.getIsActive() : true);
        entity.setIsSystem(false);
        entity.setVersion(1L);
        entity.setLastChangeType("CREATED");
        return entity;
    }
}
