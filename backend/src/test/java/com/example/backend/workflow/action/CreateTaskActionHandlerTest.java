package com.example.backend.workflow.action;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;

import com.example.backend.dto.TaskCreateRequest;
import com.example.backend.entity.Dossier;
import com.example.backend.service.TaskService;
import java.util.Map;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class CreateTaskActionHandlerTest {

    @Mock
    private TaskService taskService;

    @InjectMocks
    private CreateTaskActionHandler handler;

    @Test
    void testExecute_CallsTaskService() {
        Dossier dossier = new Dossier();
        dossier.setId(1L);
        Map<String, Object> config = Map.of(
                "title", "Check lead",
                "description", "Verify documents",
                "dueInDays", 2
        );

        handler.execute(dossier, config, "user-1");

        verify(taskService).create(any(TaskCreateRequest.class));
    }
}
