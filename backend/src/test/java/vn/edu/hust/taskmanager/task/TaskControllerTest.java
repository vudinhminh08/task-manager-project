package vn.edu.hust.taskmanager.task;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.TestingAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.method.annotation.AuthenticationPrincipalArgumentResolver;
import org.springframework.test.web.servlet.MockMvc;
import vn.edu.hust.taskmanager.common.ApiExceptionHandler;
import vn.edu.hust.taskmanager.common.TaskNotFoundException;

import java.time.LocalDate;
import java.util.List;

import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;
import static org.springframework.test.web.servlet.setup.MockMvcBuilders.standaloneSetup;

class TaskControllerTest {
    private TaskService service;
    private MockMvc mockMvc;

    @BeforeEach void setUp() {
        service = mock(TaskService.class);
        mockMvc = standaloneSetup(new TaskController(service)).setControllerAdvice(new ApiExceptionHandler())
                .setCustomArgumentResolvers(new AuthenticationPrincipalArgumentResolver()).build();
        SecurityContextHolder.getContext().setAuthentication(new TestingAuthenticationToken(42L, null));
    }
    @AfterEach void tearDown() { SecurityContextHolder.clearContext(); }

    @Test
    void listsWithStatusPriorityCategoryFiltersAndOwner() throws Exception {
        when(service.list(42L, TaskStatus.DONE, TaskPriority.HIGH, "Work"))
                .thenReturn(List.of(response()));
        mockMvc.perform(get("/api/tasks").param("status", "DONE").param("priority", "HIGH").param("category", "Work"))
                .andExpect(status().isOk()).andExpect(jsonPath("$[0].id").value(9))
                .andExpect(jsonPath("$[0].userId").doesNotExist());
        verify(service).list(42L, TaskStatus.DONE, TaskPriority.HIGH, "Work");
    }

    @Test
    void createsWithLocation() throws Exception {
        TaskRequest request = new TaskRequest("Title", "Description", TaskStatus.TODO, TaskPriority.MEDIUM, "Work", LocalDate.of(2026, 7, 30));
        when(service.create(42L, request)).thenReturn(response());
        mockMvc.perform(post("/api/tasks").contentType(MediaType.APPLICATION_JSON).content("""
                {"title":"Title","description":"Description","status":"TODO","priority":"MEDIUM","category":"Work","dueDate":"2026-07-30"}
                """))
                .andExpect(status().isCreated()).andExpect(header().string("Location", "/api/tasks/9"));
        verify(service).create(42L, request);
    }

    @Test
    void mapsUnownedTaskToTaskNotFound() throws Exception {
        when(service.get(42L, 9L)).thenThrow(new TaskNotFoundException());
        mockMvc.perform(get("/api/tasks/9")).andExpect(status().isNotFound())
                .andExpect(jsonPath("$.code").value("TASK_NOT_FOUND"));
    }

    @Test
    void patchesStatusAndPinForAuthenticatedOwner() throws Exception {
        when(service.updateStatus(42L, 9L, TaskStatus.DONE)).thenReturn(response());
        when(service.updatePinned(42L, 9L, true)).thenReturn(responseWithPin());

        mockMvc.perform(patch("/api/tasks/9/status")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"status\":\"DONE\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(9));
        mockMvc.perform(patch("/api/tasks/9/pin")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"pinned\":true}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.pinned").value(true));

        verify(service).updateStatus(42L, 9L, TaskStatus.DONE);
        verify(service).updatePinned(42L, 9L, true);
    }

    @Test
    void rejectsNullPatchValues() throws Exception {
        mockMvc.perform(patch("/api/tasks/9/status")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"status\":null}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("VALIDATION_ERROR"));
        mockMvc.perform(patch("/api/tasks/9/pin")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"pinned\":null}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("VALIDATION_ERROR"));
    }

    private TaskResponse response() { return new TaskResponse(9L, "Title", "Description", TaskStatus.DONE, TaskPriority.HIGH, "Work", LocalDate.now(), null, null); }
    private TaskResponse responseWithPin() { return new TaskResponse(9L, "Title", "Description", TaskStatus.DONE, TaskPriority.HIGH, "Work", LocalDate.now(), true, null, null); }
}
