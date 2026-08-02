package vn.edu.hust.taskmanager.task.controller;

import vn.edu.hust.taskmanager.task.dto.TaskPinUpdateRequest;
import vn.edu.hust.taskmanager.task.dto.TaskPageResponse;
import vn.edu.hust.taskmanager.task.dto.TaskRequest;
import vn.edu.hust.taskmanager.task.dto.TaskResponse;
import vn.edu.hust.taskmanager.task.dto.TaskStatusUpdateRequest;
import vn.edu.hust.taskmanager.task.dto.TaskStatisticsResponse;
import vn.edu.hust.taskmanager.task.model.TaskPriority;
import vn.edu.hust.taskmanager.task.model.TaskStatus;
import vn.edu.hust.taskmanager.task.service.TaskService;

import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.net.URI;
import java.util.List;

@RestController
@RequestMapping("/api/tasks")
public class TaskController {

    private final TaskService taskService;

    public TaskController(TaskService taskService) { this.taskService = taskService; }

    @GetMapping
    public TaskPageResponse list(@AuthenticationPrincipal Long userId,
                                 @RequestParam(required = false) TaskStatus status,
                                 @RequestParam(required = false) TaskPriority priority,
                                 @RequestParam(required = false) String category,
                                 @RequestParam(defaultValue = "1") int page,
                                 @RequestParam(defaultValue = "10") int size) {
        return taskService.list(userId, status, priority, category, page, size);
    }

    @GetMapping("/pinned")
    public List<TaskResponse> pinned(@AuthenticationPrincipal Long userId) {
        return taskService.pinned(userId);
    }

    @GetMapping("/statistics")
    public TaskStatisticsResponse statistics(@AuthenticationPrincipal Long userId) {
        return taskService.statistics(userId);
    }

    @GetMapping("/{id}")
    public TaskResponse get(@AuthenticationPrincipal Long userId, @PathVariable Long id) {
        return taskService.get(userId, id);
    }

    @PostMapping
    public ResponseEntity<TaskResponse> create(@AuthenticationPrincipal Long userId,
                                               @Valid @RequestBody TaskRequest request) {
        TaskResponse response = taskService.create(userId, request);
        return ResponseEntity.created(URI.create("/api/tasks/" + response.id())).body(response);
    }

    @PutMapping("/{id}")
    public TaskResponse update(@AuthenticationPrincipal Long userId, @PathVariable Long id,
                               @Valid @RequestBody TaskRequest request) {
        return taskService.update(userId, id, request);
    }

    @PatchMapping("/{id}/status")
    public TaskResponse updateStatus(
            @AuthenticationPrincipal Long userId,
            @PathVariable Long id,
            @Valid @RequestBody TaskStatusUpdateRequest request) {
        return taskService.updateStatus(userId, id, request.status());
    }

    @PatchMapping("/{id}/pin")
    public TaskResponse updatePinned(
            @AuthenticationPrincipal Long userId,
            @PathVariable Long id,
            @Valid @RequestBody TaskPinUpdateRequest request) {
        return taskService.updatePinned(userId, id, request.pinned());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@AuthenticationPrincipal Long userId, @PathVariable Long id) {
        taskService.delete(userId, id);
        return ResponseEntity.noContent().build();
    }
}
