package vn.edu.hust.taskmanager.task.repository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import vn.edu.hust.taskmanager.task.model.Task;
import vn.edu.hust.taskmanager.task.model.TaskPriority;
import vn.edu.hust.taskmanager.task.model.TaskStatus;

public interface TaskRepositoryCustom {
    Page<Task> findFiltered(Long userId, TaskStatus status, TaskPriority priority, String category,
                            Pageable pageable);
}
