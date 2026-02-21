package com.example.backend.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;

public class NetworkSettingsDto {

    private String proxyHost;

    @Min(1)
    @Max(65535)
    private Integer proxyPort;

    @Min(100)
    @Max(300000)
    private Integer connectTimeout;

    @Min(100)
    @Max(300000)
    private Integer readTimeout;

    public NetworkSettingsDto() {
    }

    public NetworkSettingsDto(String proxyHost, Integer proxyPort, Integer connectTimeout, Integer readTimeout) {
        this.proxyHost = proxyHost;
        this.proxyPort = proxyPort;
        this.connectTimeout = connectTimeout;
        this.readTimeout = readTimeout;
    }

    public String getProxyHost() {
        return proxyHost;
    }

    public void setProxyHost(String proxyHost) {
        this.proxyHost = proxyHost;
    }

    public Integer getProxyPort() {
        return proxyPort;
    }

    public void setProxyPort(Integer proxyPort) {
        this.proxyPort = proxyPort;
    }

    public Integer getConnectTimeout() {
        return connectTimeout;
    }

    public void setConnectTimeout(Integer connectTimeout) {
        this.connectTimeout = connectTimeout;
    }

    public Integer getReadTimeout() {
        return readTimeout;
    }

    public void setReadTimeout(Integer readTimeout) {
        this.readTimeout = readTimeout;
    }
}
