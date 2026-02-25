package com.example.backend.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

import com.example.backend.entity.Annonce;
import com.example.backend.entity.enums.AnnonceStatus;
import com.example.backend.repository.AnnonceRepository;
import com.example.backend.repository.DossierRepository;
import com.example.backend.repository.LeadActivityRepository;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class YieldManagementServiceTest {

    @Mock private AnnonceRepository annonceRepository;

    @Mock private DossierRepository dossierRepository;

    @Mock private LeadActivityRepository leadActivityRepository;

    @InjectMocks private YieldManagementService yieldManagementService;

    @Test
    void evaluateYield_HighInterest_IncreasesPrice() {
        // Arrange
        Annonce annonce = new Annonce();
        annonce.setId(1L);
        annonce.setPrice(BigDecimal.valueOf(100000));
        annonce.setStatus(AnnonceStatus.ACTIVE);

        when(annonceRepository.findAll()).thenReturn(List.of(annonce));
        // Simulate high interest (dossierCount * 3 + activityCount > 15) -> 6 dossiers
        // * 3 = 18
        when(dossierRepository.countByAnnonceIdAndCreatedAtAfter(eq(1L), any(LocalDateTime.class)))
                .thenReturn(6L);
        when(leadActivityRepository.countActivitiesByAnnonceIdAndCreatedAtAfter(
                        eq(1L), any(LocalDateTime.class)))
                .thenReturn(0L);

        // Act
        yieldManagementService.evaluateYield();

        // Assert
        verify(annonceRepository, times(1)).save(annonce);
        // Price should be increased by 2% -> 100000 * 1.02 = 102000
        assertThat(annonce.getPrice().intValue()).isEqualTo(102000);
        assertThat(annonce.getAiScoreDetails()).contains("Yield Management: Fort intérêt (+2%)");
    }

    @Test
    void evaluateYield_LowInterest_GeneratesAlert() {
        // Arrange
        Annonce annonce = new Annonce();
        annonce.setId(2L);
        annonce.setPrice(BigDecimal.valueOf(200000));
        annonce.setStatus(AnnonceStatus.ACTIVE);

        when(annonceRepository.findAll()).thenReturn(List.of(annonce));
        // Simulate low interest (total interest < 3 in the last month) -> 0 dossiers, 1
        // activity
        when(dossierRepository.countByAnnonceIdAndCreatedAtAfter(eq(2L), any(LocalDateTime.class)))
                .thenReturn(0L);
        when(leadActivityRepository.countActivitiesByAnnonceIdAndCreatedAtAfter(
                        eq(2L), any(LocalDateTime.class)))
                .thenReturn(1L);

        // Act
        yieldManagementService.evaluateYield();

        // Assert
        verify(annonceRepository, times(1)).save(annonce);
        assertThat(annonce.getPrice().intValue()).isEqualTo(200000); // Price shouldn't change
        assertThat(annonce.getAiScoreDetails())
                .contains("Yield Management: Faible intérêt après 30 jours");
    }

    @Test
    void evaluateYield_ModerateInterest_NoChange() {
        // Arrange
        Annonce annonce = new Annonce();
        annonce.setId(3L);
        annonce.setPrice(BigDecimal.valueOf(300000));
        annonce.setStatus(AnnonceStatus.ACTIVE);

        when(annonceRepository.findAll()).thenReturn(List.of(annonce));
        // Simulate moderate interest: weekly=10, monthly=10
        when(dossierRepository.countByAnnonceIdAndCreatedAtAfter(eq(3L), any(LocalDateTime.class)))
                .thenReturn(2L);
        when(leadActivityRepository.countActivitiesByAnnonceIdAndCreatedAtAfter(
                        eq(3L), any(LocalDateTime.class)))
                .thenReturn(4L);

        // Act
        yieldManagementService.evaluateYield();

        // Assert
        verify(annonceRepository, never()).save(annonce);
        assertThat(annonce.getPrice().intValue()).isEqualTo(300000);
        assertThat(annonce.getAiScoreDetails()).isNull();
    }
}
