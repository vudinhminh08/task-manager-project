package vn.edu.hust.taskmanager.task;

import java.util.List;

public interface TaskRepositoryCustom {
    List<Task> findFiltered(Long userId, TaskStatus status, TaskPriority priority, String category);
}
