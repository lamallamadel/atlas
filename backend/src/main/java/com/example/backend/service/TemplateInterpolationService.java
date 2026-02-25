package com.example.backend.service;

import com.example.backend.entity.TemplateVariable;
import com.example.backend.entity.WhatsAppTemplate;
import com.example.backend.repository.WhatsAppTemplateRepository;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

@Service
public class TemplateInterpolationService {

    private static final Logger logger = LoggerFactory.getLogger(TemplateInterpolationService.class);
    private static final Pattern VARIABLE_PATTERN = Pattern.compile("\\{\\{([^}]+)\\}\\}");

    private final WhatsAppTemplateRepository templateRepository;

    public TemplateInterpolationService(WhatsAppTemplateRepository templateRepository) {
        this.templateRepository = templateRepository;
    }

    public String interpolateTemplate(String templateCode, Map<String, String> variables) {
        if (templateCode == null || templateCode.trim().isEmpty()) {
            throw new IllegalArgumentException("Template code cannot be null or empty");
        }

        WhatsAppTemplate template = templateRepository
                .findByNameAndLanguage(templateCode, "fr")
                .orElseThrow(() -> new IllegalArgumentException(
                        "Template not found: " + templateCode));

        String content = extractTemplateContent(template);
        if (content == null) {
            throw new IllegalStateException(
                    "Template " + templateCode + " has no body content");
        }

        return interpolateString(content, variables);
    }

    public String interpolateString(String template, Map<String, String> variables) {
        if (template == null) {
            return null;
        }

        if (variables == null || variables.isEmpty()) {
            return template;
        }

        StringBuffer result = new StringBuffer();
        Matcher matcher = VARIABLE_PATTERN.matcher(template);

        while (matcher.find()) {
            String variableName = matcher.group(1).trim();
            String replacement = variables.get(variableName);
            
            if (replacement == null) {
                logger.warn("Variable '{}' not found in provided values, keeping placeholder", variableName);
                replacement = "{{" + variableName + "}}";
            }
            
            matcher.appendReplacement(result, Matcher.quoteReplacement(replacement));
        }
        matcher.appendTail(result);

        return result.toString();
    }

    public Map<String, String> validateRequiredVariables(
            String templateCode, Map<String, String> providedVariables) {
        WhatsAppTemplate template = templateRepository
                .findByNameAndLanguage(templateCode, "fr")
                .orElseThrow(() -> new IllegalArgumentException(
                        "Template not found: " + templateCode));

        List<TemplateVariable> requiredVars = template.getVariables().stream()
                .filter(v -> v.getIsRequired() != null && v.getIsRequired())
                .toList();

        Map<String, String> missing = new HashMap<>();
        for (TemplateVariable var : requiredVars) {
            if (!providedVariables.containsKey(var.getVariableName())
                    || providedVariables.get(var.getVariableName()) == null
                    || providedVariables.get(var.getVariableName()).trim().isEmpty()) {
                missing.put(var.getVariableName(), var.getDescription());
            }
        }

        return missing;
    }

    private String extractTemplateContent(WhatsAppTemplate template) {
        List<Map<String, Object>> components = template.getComponents();
        if (components == null || components.isEmpty()) {
            return null;
        }

        for (Map<String, Object> component : components) {
            String type = (String) component.get("type");
            if ("BODY".equals(type)) {
                return (String) component.get("text");
            }
        }

        return null;
    }
}
