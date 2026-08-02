package vn.edu.hust.taskmanager.task.service;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import vn.edu.hust.taskmanager.auth.model.User;
import vn.edu.hust.taskmanager.auth.repository.UserRepository;
import vn.edu.hust.taskmanager.common.InvalidCredentialsException;
import vn.edu.hust.taskmanager.common.TaskNotFoundException;
import vn.edu.hust.taskmanager.task.dto.TaskRequest;
import vn.edu.hust.taskmanager.task.dto.TaskPageResponse;
import vn.edu.hust.taskmanager.task.dto.TaskResponse;
import vn.edu.hust.taskmanager.task.dto.TaskStatisticsResponse;
import vn.edu.hust.taskmanager.task.model.Task;
import vn.edu.hust.taskmanager.task.model.TaskPriority;
import vn.edu.hust.taskmanager.task.model.TaskStatus;
import vn.edu.hust.taskmanager.task.repository.TaskRepository;

import java.util.List;
import java.time.LocalDate;
import java.util.Comparator;

@Service
public class TaskService {

    private final TaskRepository taskRepository;
    private final UserRepository userRepository;

    public TaskService(TaskRepository taskRepository, UserRepository userRepository) {
        this.taskRepository = taskRepository;
        this.userRepository = userRepository;
    }

    @Transactional(readOnly = true)
    public TaskPageResponse list(Long userId, TaskStatus status, TaskPriority priority, String category,
                                 int page, int size) {
        int normalizedPage = Math.max(page, 1);
        int normalizedSize = Math.min(Math.max(size, 1), 50);
        Pageable pageable = PageRequest.of(normalizedPage - 1, normalizedSize);
        Page<Task> result = taskRepository.findFiltered(
                userId, status, priority, normalizeOptional(category), pageable);
        if (result.getTotalPages() > 0 && normalizedPage > result.getTotalPages()) {
            normalizedPage = result.getTotalPages();
            pageable = PageRequest.of(normalizedPage - 1, normalizedSize);
            result = taskRepository.findFiltered(
                    userId, status, priority, normalizeOptional(category), pageable);
        }
        return new TaskPageResponse(
                result.getContent().stream().map(this::toResponse).toList(),
                result.getNumber() + 1,
                result.getSize(),
                result.getTotalElements(),
                result.getTotalPages());
    }

    @Transactional(readOnly = true)
    public List<TaskResponse> pinned(Long userId) {
        return taskRepository.findByUser_IdAndPinnedTrueOrderByCreatedAtDescIdDesc(userId)
                .stream().map(this::toResponse).toList();
    }

    @Transactional(readOnly = true)
    public TaskStatisticsResponse statistics(Long userId) {
        List<Task> tasks = taskRepository.findByUser_IdOrderByCreatedAtDescIdDesc(userId);
        LocalDate today = LocalDate.now();
        List<Task> overdueTasks = tasks.stream()
                .filter(task -> task.getDueDate() != null
                        && task.getDueDate().isBefore(today)
                        && task.getStatus() != TaskStatus.DONE)
                .sorted(Comparator
                        .comparing(Task::getDueDate)
                        .thenComparing(task -> priorityRank(task.getPriority())))
                .toList();
        return new TaskStatisticsResponse(
                (int) tasks.stream().filter(task -> task.getStatus() == TaskStatus.TODO).count(),
                (int) tasks.stream().filter(task -> task.getStatus() == TaskStatus.IN_PROGRESS).count(),
                (int) tasks.stream().filter(task -> task.getStatus() == TaskStatus.DONE).count(),
                overdueTasks.size(),
                overdueTasks.stream().map(this::toResponse).toList());
    }

    @Transactional(readOnly = true)
    public TaskResponse get(Long userId, Long taskId) {
        return toResponse(findOwned(taskId, userId));
    }

    @Transactional
    public TaskResponse create(Long userId, TaskRequest request) {
        User owner = userRepository.findById(userId).orElseThrow(InvalidCredentialsException::new);
        Task task = new Task(owner, request.title(), normalizeDescription(request.description()),
                request.status(), request.priority(), request.category(), request.dueDate());
        return toResponse(taskRepository.save(task));
    }

    @Transactional
    public TaskResponse update(Long userId, Long taskId, TaskRequest request) {
        Task task = findOwned(taskId, userId);
        task.update(request.title(), normalizeDescription(request.description()), request.status(),
                request.priority(), request.category(), request.dueDate());
        return toResponse(taskRepository.save(task));
    }

    @Transactional
    public TaskResponse updateStatus(Long userId, Long taskId, TaskStatus status) {
        Task task = findOwned(taskId, userId);
        task.updateStatus(status);
        return toResponse(taskRepository.save(task));
    }

    @Transactional
    public TaskResponse updatePinned(Long userId, Long taskId, boolean pinned) {
        Task task = findOwned(taskId, userId);
        task.updatePinned(pinned);
        return toResponse(taskRepository.save(task));
    }

    @Transactional
    public void delete(Long userId, Long taskId) {
        taskRepository.delete(findOwned(taskId, userId));
    }

    private Task findOwned(Long taskId, Long userId) {
        return taskRepository.findByIdAndUserId(taskId, userId)
                .orElseThrow(TaskNotFoundException::new);
    }

    private String normalizeOptional(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }

    private int priorityRank(TaskPriority priority) {
        return switch (priority) {
            case HIGH -> 0;
            case MEDIUM -> 1;
            case LOW -> 2;
        };
    }

    private String normalizeDescription(String description) {
        return normalizeOptional(description);
    }

    private TaskResponse toResponse(Task task) {
        return new TaskResponse(task.getId(), task.getTitle(), task.getDescription(), task.getStatus(),
                task.getPriority(), task.getCategory(), task.getDueDate(), task.isPinned(),
                task.getCreatedAt(), task.getUpdatedAt());
    }
}
