package com.example.backend.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.example.backend.dto.CreateReservationRequest;
import com.example.backend.dto.LotReservationDto;
import com.example.backend.entity.Dossier;
import com.example.backend.entity.LotReservation;
import com.example.backend.entity.ProgramLot;
import com.example.backend.entity.RealEstateProgram;
import com.example.backend.entity.enums.LotStatus;
import com.example.backend.entity.enums.ReservationStatus;
import com.example.backend.repository.DossierRepository;
import com.example.backend.repository.LotReservationRepository;
import com.example.backend.repository.ProgramLotRepository;
import com.example.backend.repository.RealEstateProgramRepository;
import com.example.backend.util.TenantContext;
import java.math.BigDecimal;
import java.util.Optional;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class LotReservationServiceTest {

    @Mock private LotReservationRepository reservationRepository;
    @Mock private ProgramLotRepository lotRepository;
    @Mock private DossierRepository dossierRepository;
    @Mock private RealEstateProgramRepository programRepository;

    @InjectMocks
    private LotReservationService service;

    private ProgramLot lot;
    private RealEstateProgram program;
    private Dossier dossier;

    @BeforeEach
    void setUp() {
        TenantContext.setOrgId("org-promoter");

        program = new RealEstateProgram();
        program.setId(10L);
        program.setAvailableLots(5);

        lot = new ProgramLot();
        lot.setId(100L);
        lot.setOrgId("org-promoter");
        lot.setStatus(LotStatus.AVAILABLE);
        lot.setProgram(program);

        dossier = new Dossier();
        dossier.setId(500L);
        dossier.setOrgId("org-promoter");
    }

    @AfterEach
    void tearDown() {
        TenantContext.clear();
    }

    @Test
    void testReserveLot_Success_DecrementsAvailableLots() {
        CreateReservationRequest request = new CreateReservationRequest();
        request.setDossierId(500L);
        request.setDepositAmount(new BigDecimal("50000"));

        when(lotRepository.findById(100L)).thenReturn(Optional.of(lot));
        when(dossierRepository.findById(500L)).thenReturn(Optional.of(dossier));

        LotReservation savedReservation = new LotReservation();
        savedReservation.setId(999L);
        savedReservation.setLot(lot);
        savedReservation.setDossier(dossier);
        savedReservation.setStatus(ReservationStatus.PENDING);
        savedReservation.setDepositAmount(new BigDecimal("50000"));

        when(reservationRepository.save(any(LotReservation.class))).thenReturn(savedReservation);

        LotReservationDto response = service.reserveLot(100L, request);

        assertThat(response.getId()).isEqualTo(999L);
        assertThat(response.getStatus()).isEqualTo(ReservationStatus.PENDING);
        assertThat(response.getDepositAmount()).isEqualByComparingTo("50000");

        // Verify state changes
        assertThat(lot.getStatus()).isEqualTo(LotStatus.RESERVED);
        verify(lotRepository).save(lot);

        assertThat(program.getAvailableLots()).isEqualTo(4);
        verify(programRepository).save(program);
    }

    @Test
    void testReserveLot_LotNotAvailable_ThrowsException() {
        lot.setStatus(LotStatus.SOLD);
        when(lotRepository.findById(100L)).thenReturn(Optional.of(lot));

        CreateReservationRequest request = new CreateReservationRequest();
        request.setDossierId(500L);

        assertThatThrownBy(() -> service.reserveLot(100L, request))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("not available for reservation");
    }

    @Test
    void testConfirmReservation_Success_SetsLotToSold() {
        LotReservation reservation = new LotReservation();
        reservation.setId(999L);
        reservation.setOrgId("org-promoter");
        reservation.setStatus(ReservationStatus.PENDING);
        lot.setStatus(LotStatus.RESERVED);
        reservation.setLot(lot);
        reservation.setDossier(dossier);

        when(reservationRepository.findById(999L)).thenReturn(Optional.of(reservation));
        when(reservationRepository.save(any())).thenReturn(reservation);

        LotReservationDto response = service.confirmReservation(999L);

        assertThat(response.getStatus()).isEqualTo(ReservationStatus.CONFIRMED);
        assertThat(lot.getStatus()).isEqualTo(LotStatus.SOLD);
        verify(lotRepository).save(lot);
    }
}
