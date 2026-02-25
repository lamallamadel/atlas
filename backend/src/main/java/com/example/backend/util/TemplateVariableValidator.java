package com.example.backend.util;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

public class TemplateVariableValidator {

    private static final Pattern META_VARIABLE_PATTERN = Pattern.compile("\\{\\{(\\d+)\\}\\}");

    public static ValidationResult validateMetaNaming(List<Map<String, Object>> components) {
        ValidationResult result = new ValidationResult();
        result.setValid(true);

        if (components == null || components.isEmpty()) {
            result.setValid(false);
            result.addError("Components cannot be null or empty");
            return result;
        }

        for (Map<String, Object> component : components) {
            String type = (String) component.get("type");
            if (type == null) {
                continue;
            }

            switch (type.toUpperCase()) {
                case "HEADER":
                    String format = (String) component.get("format");
                    if ("TEXT".equalsIgnoreCase(format)) {
                        String text = (String) component.get("text");
                        if (text != null) {
                            ValidationResult headerResult = validateTextVariables(text, "HEADER");
                            if (!headerResult.isValid()) {
                                result.setValid(false);
                                result.getErrors().addAll(headerResult.getErrors());
                            }
                        }
                    }
                    break;

                case "BODY":
                    String bodyText = (String) component.get("text");
                    if (bodyText != null) {
                        ValidationResult bodyResult = validateTextVariables(bodyText, "BODY");
                        if (!bodyResult.isValid()) {
                            result.setValid(false);
                            result.getErrors().addAll(bodyResult.getErrors());
                        }
                    }
                    break;

                case "BUTTONS":
                    @SuppressWarnings("unchecked")
                    List<Map<String, Object>> buttons = (List<Map<String, Object>>) component.get("buttons");
                    if (buttons != null) {
                        ValidationResult buttonsResult = validateButtonsVariables(buttons);
                        if (!buttonsResult.isValid()) {
                            result.setValid(false);
                            result.getErrors().addAll(buttonsResult.getErrors());
                        }
                    }
                    break;
            }
        }

        return result;
    }

    private static ValidationResult validateTextVariables(String text, String componentType) {
        ValidationResult result = new ValidationResult();
        result.setValid(true);

        if (text == null || text.isEmpty()) {
            return result;
        }

        Matcher matcher = META_VARIABLE_PATTERN.matcher(text);
        List<Integer> positions = new ArrayList<>();

        while (matcher.find()) {
            int position = Integer.parseInt(matcher.group(1));
            positions.add(position);
        }

        if (positions.isEmpty()) {
            return result;
        }

        for (int i = 0; i < positions.size(); i++) {
            int expectedPosition = i + 1;
            int actualPosition = positions.get(i);

            if (actualPosition != expectedPosition) {
                result.setValid(false);
                result.addError(
                        String.format(
                                "%s: Variables must be sequential starting from {{1}}. Expected {{%d}} but found {{%d}}",
                                componentType, expectedPosition, actualPosition));
            }
        }

        return result;
    }

    private static ValidationResult validateButtonsVariables(List<Map<String, Object>> buttons) {
        ValidationResult result = new ValidationResult();
        result.setValid(true);

        for (Map<String, Object> button : buttons) {
            String type = (String) button.get("type");
            if ("URL".equalsIgnoreCase(type)) {
                String url = (String) button.get("url");
                if (url != null && url.contains("{{")) {
                    ValidationResult urlResult = validateTextVariables(url, "BUTTON URL");
                    if (!urlResult.isValid()) {
                        result.setValid(false);
                        result.getErrors().addAll(urlResult.getErrors());
                    }
                }
            }
        }

        return result;
    }

    public static class ValidationResult {
        private boolean valid;
        private List<String> errors = new ArrayList<>();

        public boolean isValid() {
            return valid;
        }

        public void setValid(boolean valid) {
            this.valid = valid;
        }

        public List<String> getErrors() {
            return errors;
        }

        public void setErrors(List<String> errors) {
            this.errors = errors;
        }

        public void addError(String error) {
            this.errors.add(error);
        }
    }
}
