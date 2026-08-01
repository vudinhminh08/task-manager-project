package vn.edu.hust.taskmanager.task;

import java.time.Instant;
import java.time.LocalDate;

public record TaskResponse(
        Long id,
        String title,
        String description,
        TaskStatus status,
        TaskPriority priority,
        String category,
        LocalDate dueDate,
        boolean pinned,
        Instant createdAt,
        Instant updatedAt) {

    public TaskResponse(
            Long id,
            String title,
            String description,
            TaskStatus status,
            TaskPriority priority,
            String category,
            LocalDate dueDate,
            Instant createdAt,
            Instant updatedAt) {
        this(id, title, description, status, priority, category, dueDate, false, createdAt, updatedAt);
    }
}
