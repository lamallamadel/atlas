package com.example.backend.exception;

import com.fasterxml.jackson.annotation.JsonInclude;
import io.swagger.v3.oas.annotations.media.Schema;

import java.util.HashMap;
import java.util.Map;

@Schema(description = "RFC 7807 Problem Detail response")
@JsonInclude(JsonInclude.Include.NON_NULL)
public class ProblemDetail {

    @Schema(description = "URI reference that identifies the problem type", example = "about:blank")
    private String type;

    @Schema(description = "Short, human-readable summary of the problem", example = "Bad Request")
    private String title;

    @Schema(description = "HTTP status code", example = "400")
    private int status;

    @Schema(description = "Human-readable explanation specific to this occurrence", example = "Validation failed for the request")
    private String detail;

    @Schema(description = "URI reference that identifies the specific occurrence", example = "/api/users/123")
    private String instance;

    @Schema(description = "Additional properties for extensibility")
    private Map<String, Object> properties;

    public ProblemDetail() {
        this.type = "about:blank";
    }

    public ProblemDetail(String type, String title, int status, String detail, String instance) {
        this.type = type != null ? type : "about:blank";
        this.title = title;
        this.status = status;
        this.detail = detail;
        this.instance = instance;
    }

    public String getType() {
        return type;
    }

    public void setType(String type) {
        this.type = type;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public int getStatus() {
        return status;
    }

    public void setStatus(int status) {
        this.status = status;
    }

    public String getDetail() {
        return detail;
    }

    public void setDetail(String detail) {
        this.detail = detail;
    }

    public String getInstance() {
        return instance;
    }

    public void setInstance(String instance) {
        this.instance = instance;
    }

    public Map<String, Object> getProperties() {
        return properties;
    }

    public void setProperties(Map<String, Object> properties) {
        this.properties = properties;
    }

    public void addProperty(String key, Object value) {
        if (this.properties == null) {
            this.properties = new HashMap<>();
        }
        this.properties.put(key, value);
    }
}
