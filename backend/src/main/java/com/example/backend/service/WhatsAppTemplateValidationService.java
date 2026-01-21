package com.example.backend.service;

import com.example.backend.entity.WhatsAppTemplate;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
public class WhatsAppTemplateValidationService {

    private static final int MAX_TEMPLATE_NAME_LENGTH = 512;
    private static final int MAX_HEADER_LENGTH = 60;
    private static final int MAX_BODY_LENGTH = 1024;
    private static final int MAX_FOOTER_LENGTH = 60;
    private static final int MAX_BUTTON_TEXT_LENGTH = 25;
    private static final int MAX_BUTTONS = 10;
    private static final int MAX_QUICK_REPLY_BUTTONS = 3;
    private static final int MAX_CALL_TO_ACTION_BUTTONS = 2;
    
    private static final Pattern VARIABLE_PATTERN = Pattern.compile("\\{\\{(\\d+)\\}\\}");
    private static final Pattern LANGUAGE_CODE_PATTERN = Pattern.compile("^[a-z]{2}(_[A-Z]{2})?$");

    public void validateTemplateFormat(WhatsAppTemplate template) {
        if (template == null) {
            throw new IllegalArgumentException("Template cannot be null");
        }

        validateTemplateName(template.getName());
        validateLanguageCode(template.getLanguage());
        validateCategory(template.getCategory());
        validateComponents(template.getComponents());
    }

    private void validateTemplateName(String name) {
        if (name == null || name.trim().isEmpty()) {
            throw new IllegalArgumentException("Template name is required");
        }

        if (name.length() > MAX_TEMPLATE_NAME_LENGTH) {
            throw new IllegalArgumentException(
                    String.format("Template name exceeds maximum length of %d characters", MAX_TEMPLATE_NAME_LENGTH));
        }

        if (!name.matches("^[a-z0-9_]+$")) {
            throw new IllegalArgumentException(
                    "Template name can only contain lowercase letters, numbers, and underscores");
        }
    }

    private void validateLanguageCode(String language) {
        if (language == null || language.trim().isEmpty()) {
            throw new IllegalArgumentException("Language code is required");
        }

        if (!LANGUAGE_CODE_PATTERN.matcher(language).matches()) {
            throw new IllegalArgumentException(
                    "Invalid language code format. Expected format: 'en' or 'en_US'");
        }
    }

    private void validateCategory(Object category) {
        if (category == null) {
            throw new IllegalArgumentException("Template category is required");
        }
    }

    private void validateComponents(List<Map<String, Object>> components) {
        if (components == null || components.isEmpty()) {
            throw new IllegalArgumentException("Template must have at least one component (body is required)");
        }

        boolean hasBody = false;
        boolean hasHeader = false;
        boolean hasFooter = false;
        boolean hasButtons = false;

        for (Map<String, Object> component : components) {
            String type = (String) component.get("type");
            
            if (type == null) {
                throw new IllegalArgumentException("Component type is required");
            }

            switch (type.toUpperCase()) {
                case "HEADER":
                    if (hasHeader) {
                        throw new IllegalArgumentException("Template can only have one header component");
                    }
                    validateHeaderComponent(component);
                    hasHeader = true;
                    break;
                    
                case "BODY":
                    if (hasBody) {
                        throw new IllegalArgumentException("Template can only have one body component");
                    }
                    validateBodyComponent(component);
                    hasBody = true;
                    break;
                    
                case "FOOTER":
                    if (hasFooter) {
                        throw new IllegalArgumentException("Template can only have one footer component");
                    }
                    validateFooterComponent(component);
                    hasFooter = true;
                    break;
                    
                case "BUTTONS":
                    if (hasButtons) {
                        throw new IllegalArgumentException("Template can only have one buttons component");
                    }
                    validateButtonsComponent(component);
                    hasButtons = true;
                    break;
                    
                default:
                    throw new IllegalArgumentException("Unknown component type: " + type);
            }
        }

        if (!hasBody) {
            throw new IllegalArgumentException("Template must have a body component");
        }
    }

    private void validateHeaderComponent(Map<String, Object> component) {
        String format = (String) component.get("format");
        
        if (format == null) {
            throw new IllegalArgumentException("Header format is required");
        }

        switch (format.toUpperCase()) {
            case "TEXT":
                String text = (String) component.get("text");
                if (text == null || text.trim().isEmpty()) {
                    throw new IllegalArgumentException("Header text is required");
                }
                if (text.length() > MAX_HEADER_LENGTH) {
                    throw new IllegalArgumentException(
                            String.format("Header text exceeds maximum length of %d characters", MAX_HEADER_LENGTH));
                }
                validateVariables(text, "header");
                break;
                
            case "IMAGE":
            case "VIDEO":
            case "DOCUMENT":
                break;
                
            default:
                throw new IllegalArgumentException("Invalid header format: " + format);
        }
    }

    private void validateBodyComponent(Map<String, Object> component) {
        String text = (String) component.get("text");
        
        if (text == null || text.trim().isEmpty()) {
            throw new IllegalArgumentException("Body text is required");
        }

        if (text.length() > MAX_BODY_LENGTH) {
            throw new IllegalArgumentException(
                    String.format("Body text exceeds maximum length of %d characters", MAX_BODY_LENGTH));
        }

        validateVariables(text, "body");
    }

    private void validateFooterComponent(Map<String, Object> component) {
        String text = (String) component.get("text");
        
        if (text == null || text.trim().isEmpty()) {
            throw new IllegalArgumentException("Footer text is required");
        }

        if (text.length() > MAX_FOOTER_LENGTH) {
            throw new IllegalArgumentException(
                    String.format("Footer text exceeds maximum length of %d characters", MAX_FOOTER_LENGTH));
        }

        if (text.contains("{{")) {
            throw new IllegalArgumentException("Footer cannot contain variables");
        }
    }

    @SuppressWarnings("unchecked")
    private void validateButtonsComponent(Map<String, Object> component) {
        Object buttonsObj = component.get("buttons");
        
        if (!(buttonsObj instanceof List)) {
            throw new IllegalArgumentException("Buttons must be a list");
        }

        List<Map<String, Object>> buttons = (List<Map<String, Object>>) buttonsObj;

        if (buttons.isEmpty()) {
            throw new IllegalArgumentException("Buttons component must have at least one button");
        }

        if (buttons.size() > MAX_BUTTONS) {
            throw new IllegalArgumentException(
                    String.format("Maximum of %d buttons allowed", MAX_BUTTONS));
        }

        int quickReplyCount = 0;
        int callToActionCount = 0;

        for (Map<String, Object> button : buttons) {
            String type = (String) button.get("type");
            String text = (String) button.get("text");

            if (type == null) {
                throw new IllegalArgumentException("Button type is required");
            }

            if (text != null && text.length() > MAX_BUTTON_TEXT_LENGTH) {
                throw new IllegalArgumentException(
                        String.format("Button text exceeds maximum length of %d characters", MAX_BUTTON_TEXT_LENGTH));
            }

            switch (type.toUpperCase()) {
                case "QUICK_REPLY":
                    quickReplyCount++;
                    if (quickReplyCount > MAX_QUICK_REPLY_BUTTONS) {
                        throw new IllegalArgumentException(
                                String.format("Maximum of %d quick reply buttons allowed", MAX_QUICK_REPLY_BUTTONS));
                    }
                    break;
                    
                case "URL":
                case "PHONE_NUMBER":
                    callToActionCount++;
                    if (callToActionCount > MAX_CALL_TO_ACTION_BUTTONS) {
                        throw new IllegalArgumentException(
                                String.format("Maximum of %d call-to-action buttons allowed", MAX_CALL_TO_ACTION_BUTTONS));
                    }
                    validateCallToActionButton(button, type);
                    break;
                    
                default:
                    throw new IllegalArgumentException("Invalid button type: " + type);
            }
        }
    }

    private void validateCallToActionButton(Map<String, Object> button, String type) {
        if ("URL".equalsIgnoreCase(type)) {
            String url = (String) button.get("url");
            if (url == null || url.trim().isEmpty()) {
                throw new IllegalArgumentException("URL is required for URL button");
            }
        } else if ("PHONE_NUMBER".equalsIgnoreCase(type)) {
            String phoneNumber = (String) button.get("phone_number");
            if (phoneNumber == null || phoneNumber.trim().isEmpty()) {
                throw new IllegalArgumentException("Phone number is required for phone number button");
            }
        }
    }

    private void validateVariables(String text, String componentName) {
        Matcher matcher = VARIABLE_PATTERN.matcher(text);
        int expectedPosition = 1;

        while (matcher.find()) {
            int position = Integer.parseInt(matcher.group(1));
            
            if (position != expectedPosition) {
                throw new IllegalArgumentException(
                        String.format("Variables in %s must be sequential starting from {{1}}. Found {{%d}} but expected {{%d}}",
                                componentName, position, expectedPosition));
            }
            
            expectedPosition++;
        }
    }
}
