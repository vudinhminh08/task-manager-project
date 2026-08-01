package vn.edu.hust.taskmanager.task.repository;

import vn.edu.hust.taskmanager.task.model.Task;
import vn.edu.hust.taskmanager.task.model.TaskPriority;
import vn.edu.hust.taskmanager.task.model.TaskStatus;

import java.util.List;

public interface TaskRepositoryCustom {
    List<Task> findFiltered(Long userId, TaskStatus status, TaskPriority priority, String category);
}
