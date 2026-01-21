package com.example.backend.dto;

import io.swagger.v3.oas.annotations.media.Schema;

import java.util.List;

@Schema(description = "Referential template for import/export")
public class ReferentialTemplateDto {

    @Schema(description = "Template name", example = "Real Estate CRM Default")
    private String templateName;

    @Schema(description = "Template description", example = "Default referential values for real estate CRM")
    private String templateDescription;

    @Schema(description = "Template version", example = "1.0")
    private String version;

    @Schema(description = "List of referential items")
    private List<ReferentialTemplateItem> items;

    public String getTemplateName() {
        return templateName;
    }

    public void setTemplateName(String templateName) {
        this.templateName = templateName;
    }

    public String getTemplateDescription() {
        return templateDescription;
    }

    public void setTemplateDescription(String templateDescription) {
        this.templateDescription = templateDescription;
    }

    public String getVersion() {
        return version;
    }

    public void setVersion(String version) {
        this.version = version;
    }

    public List<ReferentialTemplateItem> getItems() {
        return items;
    }

    public void setItems(List<ReferentialTemplateItem> items) {
        this.items = items;
    }

    @Schema(description = "Referential template item")
    public static class ReferentialTemplateItem {
        
        @Schema(description = "Category", example = "CASE_TYPE")
        private String category;
        
        @Schema(description = "Code", example = "CRM_LEAD_BUY")
        private String code;
        
        @Schema(description = "Label", example = "Prospect Achat")
        private String label;
        
        @Schema(description = "Description", example = "Lead for property purchase")
        private String description;
        
        @Schema(description = "Display order", example = "1")
        private Integer displayOrder;
        
        @Schema(description = "Is active", example = "true")
        private Boolean isActive;

        public String getCategory() {
            return category;
        }

        public void setCategory(String category) {
            this.category = category;
        }

        public String getCode() {
            return code;
        }

        public void setCode(String code) {
            this.code = code;
        }

        public String getLabel() {
            return label;
        }

        public void setLabel(String label) {
            this.label = label;
        }

        public String getDescription() {
            return description;
        }

        public void setDescription(String description) {
            this.description = description;
        }

        public Integer getDisplayOrder() {
            return displayOrder;
        }

        public void setDisplayOrder(Integer displayOrder) {
            this.displayOrder = displayOrder;
        }

        public Boolean getIsActive() {
            return isActive;
        }

        public void setIsActive(Boolean isActive) {
            this.isActive = isActive;
        }
    }
}
