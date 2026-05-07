package com.example.backend.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

import com.example.backend.dto.CreateProgramRequest;
import com.example.backend.dto.RealEstateProgramDto;
import com.example.backend.entity.RealEstateProgram;
import com.example.backend.entity.enums.ProgramStatus;
import com.example.backend.repository.RealEstateProgramRepository;
import com.example.backend.util.TenantContext;
import jakarta.persistence.EntityNotFoundException;
import java.time.LocalDate;
import java.util.Optional;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class RealEstateProgramServiceTest {

    @Mock
    private RealEstateProgramRepository repository;

    @InjectMocks
    private RealEstateProgramService service;

    @BeforeEach
    void setUp() {
        TenantContext.setOrgId("org-promoter");
    }

    @AfterEach
    void tearDown() {
        TenantContext.clear();
    }

    @Test
    void testCreateProgram_Success() {
        CreateProgramRequest request = new CreateProgramRequest();
        request.setName("Sunset Villas");
        request.setCity("Marrakech");
        request.setDeliveryDate(LocalDate.of(2027, 12, 31));

        RealEstateProgram savedEntity = new RealEstateProgram();
        savedEntity.setId(1L);
        savedEntity.setOrgId("org-promoter");
        savedEntity.setName("Sunset Villas");
        savedEntity.setCity("Marrakech");
        savedEntity.setStatus(ProgramStatus.DRAFT);
        savedEntity.setDeliveryDate(LocalDate.of(2027, 12, 31));

        when(repository.save(any(RealEstateProgram.class))).thenReturn(savedEntity);

        RealEstateProgramDto response = service.create(request);

        assertThat(response.getId()).isEqualTo(1L);
        assertThat(response.getName()).isEqualTo("Sunset Villas");
        assertThat(response.getStatus()).isEqualTo(ProgramStatus.DRAFT);
        assertThat(response.getCity()).isEqualTo("Marrakech");
    }

    @Test
    void testGetById_WrongOrgId_ThrowsException() {
        RealEstateProgram program = new RealEstateProgram();
        program.setId(1L);
        program.setOrgId("other-org");

        when(repository.findById(1L)).thenReturn(Optional.of(program));

        assertThatThrownBy(() -> service.getById(1L))
                .isInstanceOf(EntityNotFoundException.class)
                .hasMessageContaining("Program not found");
    }
}
