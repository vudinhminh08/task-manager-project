package vn.edu.hust.taskmanager.task;

import jakarta.validation.constraints.NotNull;

public record TaskPinUpdateRequest(@NotNull Boolean pinned) {
}
