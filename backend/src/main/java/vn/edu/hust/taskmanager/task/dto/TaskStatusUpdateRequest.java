package vn.edu.hust.taskmanager.task.dto;

import vn.edu.hust.taskmanager.task.model.TaskStatus;

import jakarta.validation.constraints.NotNull;

public record TaskStatusUpdateRequest(@NotNull TaskStatus status) {
}
