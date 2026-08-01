package vn.edu.hust.taskmanager.task.dto;

import jakarta.validation.constraints.NotNull;

public record TaskPinUpdateRequest(@NotNull Boolean pinned) {
}
