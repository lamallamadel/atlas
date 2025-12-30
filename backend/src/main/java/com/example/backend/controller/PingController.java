package com.example.backend.controller;

import com.example.backend.dto.PongResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1")
public class PingController {

    private static final Logger logger = LoggerFactory.getLogger(PingController.class);

    @GetMapping("/ping")
    public ResponseEntity<PongResponse> ping() {
        logger.info("Ping endpoint called");
        return ResponseEntity.ok(new PongResponse("pong"));
    }
}
