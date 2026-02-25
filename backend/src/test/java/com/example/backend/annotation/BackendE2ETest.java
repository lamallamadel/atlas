package com.example.backend.annotation;

import static org.springframework.test.context.TestExecutionListeners.MergeMode.MERGE_WITH_DEFAULTS;

import com.example.backend.config.H2TestConfiguration;
import com.example.backend.config.PostgresTestcontainersConfiguration;
import com.example.backend.config.TestExecutionLogger;
import com.example.backend.config.TestSecurityConfig;
import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;
import org.junit.jupiter.api.Tag;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Import;
import org.springframework.test.context.TestExecutionListeners;
import org.springframework.transaction.annotation.Transactional;

@Target(ElementType.TYPE)
@Retention(RetentionPolicy.RUNTIME)
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@AutoConfigureMockMvc
@Transactional
@Tag("backend-e2e")
@Import({
    TestSecurityConfig.class,
    PostgresTestcontainersConfiguration.class,
    H2TestConfiguration.class
})
@TestExecutionListeners(listeners = TestExecutionLogger.class, mergeMode = MERGE_WITH_DEFAULTS)
public @interface BackendE2ETest {}
