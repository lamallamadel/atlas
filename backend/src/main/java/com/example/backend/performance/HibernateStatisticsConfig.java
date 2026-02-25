package com.example.backend.performance;

import jakarta.persistence.EntityManagerFactory;
import org.hibernate.SessionFactory;
import org.hibernate.stat.Statistics;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
@ConditionalOnProperty(name = "performance.hibernate.statistics.enabled", havingValue = "true")
public class HibernateStatisticsConfig {

    private static final Logger logger = LoggerFactory.getLogger(HibernateStatisticsConfig.class);

    @Bean
    public HibernateStatisticsLogger hibernateStatisticsLogger(
            EntityManagerFactory entityManagerFactory) {
        SessionFactory sessionFactory = entityManagerFactory.unwrap(SessionFactory.class);
        Statistics statistics = sessionFactory.getStatistics();
        statistics.setStatisticsEnabled(true);

        logger.info("Hibernate statistics enabled for performance monitoring");

        return new HibernateStatisticsLogger(entityManagerFactory);
    }
}
