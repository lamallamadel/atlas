package com.example.backend.controller;

import com.example.backend.service.WhatsappService;
import java.util.Map;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/webhooks/whatsapp")
public class WhatsappController {

    private final WhatsappService whatsappService;

    public WhatsappController(WhatsappService whatsappService) {
        this.whatsappService = whatsappService;
    }

    /** Twilio sends incoming messages as form url-encoded POST requests. */
    @PostMapping(consumes = MediaType.APPLICATION_FORM_URLENCODED_VALUE)
    public ResponseEntity<String> receiveMessage(@RequestParam Map<String, String> body) {
        String from = body.get("From"); // e.g. "whatsapp:+33612345678"
        String to = body.get("To");
        String messageBody = body.get("Body");

        if (from != null && messageBody != null) {
            // Process async so we acknowledge Twilio quickly
            new Thread(
                            () -> {
                                whatsappService.processIncomingMessage(from, to, messageBody);
                            })
                    .start();
        }

        // Return empty TwiML response
        return ResponseEntity.status(HttpStatus.OK)
                .contentType(MediaType.APPLICATION_XML)
                .body("<Response></Response>");
    }
}
