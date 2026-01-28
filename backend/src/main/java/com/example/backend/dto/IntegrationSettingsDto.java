package com.example.backend.dto;

import jakarta.validation.Valid;

public class IntegrationSettingsDto {

    @Valid
    private IntegrationCredentialsDto whatsapp;

    @Valid
    private IntegrationCredentialsDto email;

    @Valid
    private IntegrationCredentialsDto sms;

    public IntegrationSettingsDto() {
        this.whatsapp = new IntegrationCredentialsDto();
        this.email = new IntegrationCredentialsDto();
        this.sms = new IntegrationCredentialsDto();
    }

    public IntegrationSettingsDto(IntegrationCredentialsDto whatsapp, IntegrationCredentialsDto email, IntegrationCredentialsDto sms) {
        this.whatsapp = whatsapp;
        this.email = email;
        this.sms = sms;
    }

    public IntegrationCredentialsDto getWhatsapp() {
        return whatsapp;
    }

    public void setWhatsapp(IntegrationCredentialsDto whatsapp) {
        this.whatsapp = whatsapp;
    }

    public IntegrationCredentialsDto getEmail() {
        return email;
    }

    public void setEmail(IntegrationCredentialsDto email) {
        this.email = email;
    }

    public IntegrationCredentialsDto getSms() {
        return sms;
    }

    public void setSms(IntegrationCredentialsDto sms) {
        this.sms = sms;
    }
}
