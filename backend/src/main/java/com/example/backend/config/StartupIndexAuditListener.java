package com.example.backend.config;

import com.example.backend.util.DatabaseIndexAudit;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.ApplicationListener;
import org.springframework.stereotype.Component;

@Component
public class StartupIndexAuditListener implements ApplicationListener<ApplicationReadyEvent> {

    private final DatabaseIndexAudit databaseIndexAudit;
    
    @Value("${database.index-audit.enabled:true}")
    private boolean indexAuditEnabled;

    public StartupIndexAuditListener(DatabaseIndexAudit databaseIndexAudit) {
        this.databaseIndexAudit = databaseIndexAudit;
    }

    @Override
    public void onApplicationEvent(ApplicationReadyEvent event) {
        if (indexAuditEnabled) {
            databaseIndexAudit.logAuditResults();
        }
    }
}
