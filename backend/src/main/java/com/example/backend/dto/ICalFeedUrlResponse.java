package com.example.backend.dto;

public class ICalFeedUrlResponse {
    
    private String feedUrl;
    private String token;

    public ICalFeedUrlResponse() {
    }

    public ICalFeedUrlResponse(String feedUrl, String token) {
        this.feedUrl = feedUrl;
        this.token = token;
    }

    public String getFeedUrl() {
        return feedUrl;
    }

    public void setFeedUrl(String feedUrl) {
        this.feedUrl = feedUrl;
    }

    public String getToken() {
        return token;
    }

    public void setToken(String token) {
        this.token = token;
    }
}
