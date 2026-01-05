package com.example.backend.service;

import com.example.backend.entity.NotificationEntity;

public interface SmsProvider extends NotificationProvider {
    @Override
    void send(NotificationEntity notification) throws Exception;
}
