package com.example.backend.dto;

import jakarta.validation.constraints.Size;

public class TaskCompleteRequest {

    @Size(max = 10000, message = "Completion notes must not exceed 10000 characters")
    private String completionNotes;

    public String getCompletionNotes() {
        return completionNotes;
    }

    public void setCompletionNotes(String completionNotes) {
        this.completionNotes = completionNotes;
    }
}
