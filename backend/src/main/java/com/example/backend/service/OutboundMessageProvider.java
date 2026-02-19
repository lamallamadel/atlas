package com.example.backend.service;

import com.example.backend.entity.OutboundMessageEntity;

public interface OutboundMessageProvider {

    ProviderSendResult send(OutboundMessageEntity message);

    boolean supports(String channel);

    boolean isRetryableError(String errorCode);
}
