package com.example.backend.event;

import com.example.backend.entity.Dossier;
import com.example.backend.entity.enums.DossierStatus;
import org.springframework.context.ApplicationEvent;

public class DossierStatusChangedEvent extends ApplicationEvent {

    private final Dossier dossier;
    private final DossierStatus fromStatus;
    private final DossierStatus toStatus;
    private final String userId;
    private final String reason;

    public DossierStatusChangedEvent(Object source, Dossier dossier, DossierStatus fromStatus, DossierStatus toStatus, String userId, String reason) {
        super(source);
        this.dossier = dossier;
        this.fromStatus = fromStatus;
        this.toStatus = toStatus;
        this.userId = userId;
        this.reason = reason;
    }

    public Dossier getDossier() {
        return dossier;
    }

    public DossierStatus getFromStatus() {
        return fromStatus;
    }

    public DossierStatus getToStatus() {
        return toStatus;
    }

    public String getUserId() {
        return userId;
    }

    public String getReason() {
        return reason;
    }
}
