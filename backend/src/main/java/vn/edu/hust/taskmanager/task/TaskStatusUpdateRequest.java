package vn.edu.hust.taskmanager.task;

import jakarta.validation.constraints.NotNull;

public record TaskStatusUpdateRequest(@NotNull TaskStatus status) {
}
