package vn.edu.hust.taskmanager.task.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import vn.edu.hust.taskmanager.task.model.Task;

import java.util.Optional;

public interface TaskRepository extends JpaRepository<Task, Long>, TaskRepositoryCustom {
    Optional<Task> findByIdAndUserId(Long id, Long userId);
}
