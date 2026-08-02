package vn.edu.hust.taskmanager.task.dto;

import java.util.List;

public record TaskStatisticsResponse(
        int todo,
        int inProgress,
        int done,
        int overdue,
        List<TaskResponse> overdueTasks) {
}
