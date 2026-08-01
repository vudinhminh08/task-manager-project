package vn.edu.hust.taskmanager.task;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface TaskRepository extends JpaRepository<Task, Long>, TaskRepositoryCustom {
    Optional<Task> findByIdAndUserId(Long id, Long userId);
}
