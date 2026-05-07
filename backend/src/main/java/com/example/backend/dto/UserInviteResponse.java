package com.example.backend.dto;

public class UserInviteResponse {

    private String id;
    private String email;
    private String status;

    public UserInviteResponse() {}

    public UserInviteResponse(String id, String email, String status) {
        this.id = id;
        this.email = email;
        this.status = status;
    }

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }
}
