package com.example.backend.service;

import com.example.backend.entity.NotificationEntity;

public interface NotificationProvider {
    void send(NotificationEntity notification) throws Exception;
}
