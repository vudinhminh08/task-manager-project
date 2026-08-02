package vn.edu.hust.taskmanager.task.dto;

import java.util.List;

public record TaskPageResponse(
        List<TaskResponse> items,
        int page,
        int size,
        long totalItems,
        int totalPages) {
}
