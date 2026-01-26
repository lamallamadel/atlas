package com.example.backend.dto;

import com.opencsv.bean.CsvBindByName;

public class LeadImportRow {

    @CsvBindByName(column = "name")
    private String name;

    @CsvBindByName(column = "phone")
    private String phone;

    @CsvBindByName(column = "email")
    private String email;

    @CsvBindByName(column = "source")
    private String source;

    @CsvBindByName(column = "lead_source")
    private String leadSource;

    @CsvBindByName(column = "notes")
    private String notes;

    @CsvBindByName(column = "score")
    private String score;

    public LeadImportRow() {
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getPhone() {
        return phone;
    }

    public void setPhone(String phone) {
        this.phone = phone;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getSource() {
        return source;
    }

    public void setSource(String source) {
        this.source = source;
    }

    public String getLeadSource() {
        return leadSource;
    }

    public void setLeadSource(String leadSource) {
        this.leadSource = leadSource;
    }

    public String getNotes() {
        return notes;
    }

    public void setNotes(String notes) {
        this.notes = notes;
    }

    public String getScore() {
        return score;
    }

    public void setScore(String score) {
        this.score = score;
    }
}
