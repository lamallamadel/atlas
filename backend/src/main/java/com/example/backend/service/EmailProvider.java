package com.example.backend.service;

import com.example.backend.entity.NotificationEntity;

public interface EmailProvider extends NotificationProvider {
    @Override
    void send(NotificationEntity notification) throws Exception;
}
