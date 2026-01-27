package com.example.backend.dto;

import java.util.List;
import java.util.Map;

public class CustomReportDefinitionDto {
    private List<String> dimensions;
    private List<String> metrics;
    private Map<String, Object> filters;
    private List<String> groupBy;
    private List<OrderByDto> orderBy;
    private Integer limit;

    public static class OrderByDto {
        private String field;
        private String direction;

        public OrderByDto() {}

        public OrderByDto(String field, String direction) {
            this.field = field;
            this.direction = direction;
        }

        public String getField() {
            return field;
        }

        public void setField(String field) {
            this.field = field;
        }

        public String getDirection() {
            return direction;
        }

        public void setDirection(String direction) {
            this.direction = direction;
        }
    }

    public CustomReportDefinitionDto() {}

    public List<String> getDimensions() {
        return dimensions;
    }

    public void setDimensions(List<String> dimensions) {
        this.dimensions = dimensions;
    }

    public List<String> getMetrics() {
        return metrics;
    }

    public void setMetrics(List<String> metrics) {
        this.metrics = metrics;
    }

    public Map<String, Object> getFilters() {
        return filters;
    }

    public void setFilters(Map<String, Object> filters) {
        this.filters = filters;
    }

    public List<String> getGroupBy() {
        return groupBy;
    }

    public void setGroupBy(List<String> groupBy) {
        this.groupBy = groupBy;
    }

    public List<OrderByDto> getOrderBy() {
        return orderBy;
    }

    public void setOrderBy(List<OrderByDto> orderBy) {
        this.orderBy = orderBy;
    }

    public Integer getLimit() {
        return limit;
    }

    public void setLimit(Integer limit) {
        this.limit = limit;
    }
}
