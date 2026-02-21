package com.example.backend.config;

import org.springframework.batch.core.Job;
import org.springframework.batch.core.Step;
import org.springframework.batch.core.job.builder.JobBuilder;
import org.springframework.batch.core.repository.JobRepository;
import org.springframework.batch.core.step.builder.StepBuilder;
import org.springframework.batch.core.step.tasklet.Tasklet;
import org.springframework.batch.repeat.RepeatStatus;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.transaction.PlatformTransactionManager;

import com.example.backend.service.DataWarehouseETLService;

import java.time.LocalDate;

@Configuration
public class BatchConfig {

    private final DataWarehouseETLService etlService;

    public BatchConfig(DataWarehouseETLService etlService) {
        this.etlService = etlService;
    }

    @Bean
    public Job dailyETLJob(JobRepository jobRepository, Step dailyETLStep) {
        return new JobBuilder("dailyETLJob", jobRepository)
                .start(dailyETLStep)
                .build();
    }

    @Bean
    public Step dailyETLStep(JobRepository jobRepository, PlatformTransactionManager transactionManager) {
        return new StepBuilder("dailyETLStep", jobRepository)
                .tasklet(dailyETLTasklet(), transactionManager)
                .build();
    }

    @Bean
    public Tasklet dailyETLTasklet() {
        return (contribution, chunkContext) -> {
            LocalDate yesterday = LocalDate.now().minusDays(1);
            
            etlService.extractLeadMetrics(yesterday);
            etlService.extractConversionMetrics(yesterday);
            etlService.extractRevenueMetrics(yesterday);
            etlService.extractAgentPerformanceMetrics(yesterday);
            
            return RepeatStatus.FINISHED;
        };
    }

    @Bean
    public Job weeklyETLJob(JobRepository jobRepository, Step weeklyETLStep) {
        return new JobBuilder("weeklyETLJob", jobRepository)
                .start(weeklyETLStep)
                .build();
    }

    @Bean
    public Step weeklyETLStep(JobRepository jobRepository, PlatformTransactionManager transactionManager) {
        return new StepBuilder("weeklyETLStep", jobRepository)
                .tasklet(weeklyETLTasklet(), transactionManager)
                .build();
    }

    @Bean
    public Tasklet weeklyETLTasklet() {
        return (contribution, chunkContext) -> {
            LocalDate lastWeekStart = LocalDate.now().minusWeeks(1);
            LocalDate lastWeekEnd = LocalDate.now().minusDays(1);
            
            etlService.extractCohortMetrics(lastWeekStart, lastWeekEnd);
            etlService.extractMarketTrendMetrics(lastWeekStart, lastWeekEnd);
            
            return RepeatStatus.FINISHED;
        };
    }
}
