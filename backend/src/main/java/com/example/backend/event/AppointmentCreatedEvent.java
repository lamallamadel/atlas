package com.example.backend.event;

import com.example.backend.entity.AppointmentEntity;
import org.springframework.context.ApplicationEvent;

public class AppointmentCreatedEvent extends ApplicationEvent {

    private final AppointmentEntity appointment;
    private final String userId;

    public AppointmentCreatedEvent(Object source, AppointmentEntity appointment, String userId) {
        super(source);
        this.appointment = appointment;
        this.userId = userId;
    }

    public AppointmentEntity getAppointment() {
        return appointment;
    }

    public String getUserId() {
        return userId;
    }
}
