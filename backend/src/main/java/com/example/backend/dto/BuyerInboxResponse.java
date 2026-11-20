package com.example.backend.dto;

import java.util.List;
import java.util.Map;

/** Page « Mes relances » : lignes triées par urgence et nombre par section. */
public record BuyerInboxResponse(List<BuyerInboxItem> items, Map<String, Integer> counts) {}
