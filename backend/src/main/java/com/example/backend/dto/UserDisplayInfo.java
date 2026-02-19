package com.example.backend.dto;

public class UserDisplayInfo {
    private final String userId;
    private final String displayName;
    private final String firstName;
    private final String lastName;
    private final String email;

    public UserDisplayInfo(
            String userId, String displayName, String firstName, String lastName, String email) {
        this.userId = userId;
        this.displayName = displayName;
        this.firstName = firstName;
        this.lastName = lastName;
        this.email = email;
    }

    public String getUserId() {
        return userId;
    }

    public String getDisplayName() {
        return displayName;
    }

    public String getFirstName() {
        return firstName;
    }

    public String getLastName() {
        return lastName;
    }

    public String getEmail() {
        return email;
    }
}
