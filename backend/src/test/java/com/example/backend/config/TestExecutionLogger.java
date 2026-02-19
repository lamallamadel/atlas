package com.example.backend.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.test.context.TestContext;
import org.springframework.test.context.TestExecutionListener;

public class TestExecutionLogger implements TestExecutionListener {

    private static final Logger log = LoggerFactory.getLogger(TestExecutionLogger.class);
    private static boolean contextPrepared = false;
    private static int testCount = 0;

    @Override
    public void beforeTestClass(TestContext testContext) {
        if (!contextPrepared) {
            log.info(
                    "╔════════════════════════════════════════════════════════════════════════════╗");
            log.info(
                    "║ Test Execution Starting                                                     ║");
            log.info(
                    "╠════════════════════════════════════════════════════════════════════════════╣");
            log.info(
                    "║ Test Class: {}",
                    String.format("%-62s", testContext.getTestClass().getSimpleName()) + "║");
            log.info(
                    "╚════════════════════════════════════════════════════════════════════════════╝");
        }
    }

    @Override
    public void prepareTestInstance(TestContext testContext) {
        if (!contextPrepared) {
            log.info("Preparing test instance: {}", testContext.getTestClass().getSimpleName());
            contextPrepared = true;
        }
    }

    @Override
    public void beforeTestMethod(TestContext testContext) {
        testCount++;
        String testMethod = testContext.getTestMethod().getName();
        log.info("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
        log.info("▶ Test #{}: {}", testCount, testMethod);
        log.info("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    }

    @Override
    public void afterTestMethod(TestContext testContext) {
        String testMethod = testContext.getTestMethod().getName();
        if (testContext.getTestException() == null) {
            log.info("✓ Test completed successfully: {}", testMethod);
        } else {
            log.error(
                    "✗ Test failed: {} - {}",
                    testMethod,
                    testContext.getTestException().getMessage());
        }
    }

    @Override
    public void afterTestClass(TestContext testContext) {
        log.info("╔════════════════════════════════════════════════════════════════════════════╗");
        log.info(
                "║ Test Class Completed: {}",
                String.format("%-54s", testContext.getTestClass().getSimpleName()) + "║");
        log.info("║ Total Tests Executed: {}", String.format("%-54s", testCount) + "║");
        log.info("╚════════════════════════════════════════════════════════════════════════════╝");
    }
}
