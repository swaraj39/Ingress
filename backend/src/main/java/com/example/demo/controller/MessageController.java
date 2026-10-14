package com.example.demo.controller;

import com.example.demo.model.Message;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.Map;

@RestController
@RequestMapping("/api")
@CrossOrigin(origins = "*")
public class MessageController {

    @Value("${app.name:Ingress Demo Backend}")
    private String appName;

    @GetMapping("/message")
    public Message getMessage() {
        return new Message(
            "Hello from the Spring Boot backend!",
            "backend-service",
            Instant.now().toEpochMilli()
        );
    }

    @GetMapping("/health")
    public ResponseEntity<Map<String, Object>> health() {
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("status", "UP");
        body.put("service", appName);
        body.put("timestamp", Instant.now().toEpochMilli());
        return ResponseEntity.ok(body);
    }

    @GetMapping("/info")
    public ResponseEntity<Map<String, Object>> info() {
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("application", appName);
        body.put("port", 8080);
        body.put("endpoints", new String[] {"/api/message", "/api/health", "/api/info"});
        body.put("note", "Reached via Kubernetes Ingress path-based routing");
        return ResponseEntity.ok(body);
    }
}
