package com.example.backend.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.example.backend.dto.CreateLotRequest;
import com.example.backend.dto.ProgramLotDto;
import com.example.backend.entity.ProgramLot;
import com.example.backend.entity.RealEstateProgram;
import com.example.backend.entity.enums.LotStatus;
import com.example.backend.entity.enums.LotType;
import com.example.backend.repository.ProgramLotRepository;
import com.example.backend.repository.RealEstateProgramRepository;
import com.example.backend.util.TenantContext;
import jakarta.persistence.EntityNotFoundException;
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
class ProgramLotServiceTest {

    @Mock
    private ProgramLotRepository lotRepository;

    @Mock
    private RealEstateProgramRepository programRepository;

    @InjectMocks
    private ProgramLotService service;

    private RealEstateProgram program;

    @BeforeEach
    void setUp() {
        TenantContext.setOrgId("org-promoter");
        
        program = new RealEstateProgram();
        program.setId(10L);
        program.setOrgId("org-promoter");
        program.setTotalLots(0);
        program.setAvailableLots(0);
    }

    @AfterEach
    void tearDown() {
        TenantContext.clear();
    }

    @Test
    void testCreateLot_UpdatesProgramCountersAndPrice() {
        CreateLotRequest request = new CreateLotRequest();
        request.setLotNumber("A101");
        request.setType(LotType.APARTMENT);
        request.setPrice(new BigDecimal("1500000"));
        request.setVirtualTourUrl("http://3d.tour/A101");

        when(programRepository.findById(10L)).thenReturn(Optional.of(program));
        
        ProgramLot savedLot = new ProgramLot();
        savedLot.setId(100L);
        savedLot.setProgram(program);
        savedLot.setLotNumber("A101");
        savedLot.setPrice(new BigDecimal("1500000"));
        savedLot.setStatus(LotStatus.AVAILABLE);
        savedLot.setVirtualTourUrl("http://3d.tour/A101");

        when(lotRepository.save(any(ProgramLot.class))).thenReturn(savedLot);

        ProgramLotDto response = service.createLot(10L, request);

        assertThat(response.getId()).isEqualTo(100L);
        assertThat(response.getLotNumber()).isEqualTo("A101");
        assertThat(response.getStatus()).isEqualTo(LotStatus.AVAILABLE);
        assertThat(response.getVirtualTourUrl()).isEqualTo("http://3d.tour/A101");

        // Verify program counters updated
        verify(programRepository).save(program);
        assertThat(program.getTotalLots()).isEqualTo(1);
        assertThat(program.getAvailableLots()).isEqualTo(1);
        assertThat(program.getMinPrice()).isEqualByComparingTo("1500000");
    }

    @Test
    void testCreateLot_WrongOrgId_ThrowsException() {
        program.setOrgId("other-org");
        when(programRepository.findById(10L)).thenReturn(Optional.of(program));

        CreateLotRequest request = new CreateLotRequest();
        
        assertThatThrownBy(() -> service.createLot(10L, request))
                .isInstanceOf(EntityNotFoundException.class)
                .hasMessageContaining("Program not found");
    }
}
