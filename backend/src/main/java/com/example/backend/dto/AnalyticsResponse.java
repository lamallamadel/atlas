package com.example.backend.dto;

import java.util.List;
import java.util.Map;

public class AnalyticsResponse {
    private String metricType;
    private List<DataPoint> data;
    private Map<String, Object> summary;

    public static class DataPoint {
        private String date;
        private Object value;
        private Map<String, Object> metadata;

        public DataPoint() {}

        public DataPoint(String date, Object value) {
            this.date = date;
            this.value = value;
        }

        public String getDate() {
            return date;
        }

        public void setDate(String date) {
            this.date = date;
        }

        public Object getValue() {
            return value;
        }

        public void setValue(Object value) {
            this.value = value;
        }

        public Map<String, Object> getMetadata() {
            return metadata;
        }

        public void setMetadata(Map<String, Object> metadata) {
            this.metadata = metadata;
        }
    }

    public String getMetricType() {
        return metricType;
    }

    public void setMetricType(String metricType) {
        this.metricType = metricType;
    }

    public List<DataPoint> getData() {
        return data;
    }

    public void setData(List<DataPoint> data) {
        this.data = data;
    }

    public Map<String, Object> getSummary() {
        return summary;
    }

    public void setSummary(Map<String, Object> summary) {
        this.summary = summary;
    }
}
