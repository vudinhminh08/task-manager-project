package vn.edu.hust.taskmanager.task;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import vn.edu.hust.taskmanager.auth.User;
import vn.edu.hust.taskmanager.auth.UserRepository;
import vn.edu.hust.taskmanager.common.InvalidCredentialsException;
import vn.edu.hust.taskmanager.common.TaskNotFoundException;

import java.util.List;

@Service
public class TaskService {

    private final TaskRepository taskRepository;
    private final UserRepository userRepository;

    public TaskService(TaskRepository taskRepository, UserRepository userRepository) {
        this.taskRepository = taskRepository;
        this.userRepository = userRepository;
    }

    @Transactional(readOnly = true)
    public List<TaskResponse> list(Long userId, TaskStatus status, TaskPriority priority, String category) {
        return taskRepository.findFiltered(userId, status, priority, normalizeOptional(category))
                .stream().map(this::toResponse).toList();
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

    private String normalizeDescription(String description) {
        return normalizeOptional(description);
    }

    private TaskResponse toResponse(Task task) {
        return new TaskResponse(task.getId(), task.getTitle(), task.getDescription(), task.getStatus(),
                task.getPriority(), task.getCategory(), task.getDueDate(), task.isPinned(),
                task.getCreatedAt(), task.getUpdatedAt());
    }
}
