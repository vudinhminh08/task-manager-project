package vn.edu.hust.taskmanager.task;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.data.jpa.test.autoconfigure.DataJpaTest;
import org.springframework.boot.jdbc.test.autoconfigure.AutoConfigureTestDatabase;
import org.springframework.test.context.ActiveProfiles;
import vn.edu.hust.taskmanager.auth.User;
import vn.edu.hust.taskmanager.auth.UserRepository;

import java.time.LocalDate;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.boot.jdbc.test.autoconfigure.AutoConfigureTestDatabase.Replace.NONE;

@DataJpaTest
@AutoConfigureTestDatabase(replace = NONE)
@ActiveProfiles("test")
class TaskRepositoryTest {
    @Autowired UserRepository userRepository;
    @Autowired TaskRepository taskRepository;

    @Test
    void scopesLookupAndFiltersStatusPriorityCategoryCaseInsensitively() {
        User owner = userRepository.save(new User("owner@example.com", "hash"));
        User other = userRepository.save(new User("other@example.com", "hash"));
        Task matching = taskRepository.save(new Task(owner, "Matching", null, TaskStatus.DONE, TaskPriority.HIGH, "Work", LocalDate.now()));
        taskRepository.save(new Task(owner, "Other status", null, TaskStatus.TODO, TaskPriority.HIGH, "Work", LocalDate.now()));
        taskRepository.save(new Task(other, "Other user", null, TaskStatus.DONE, TaskPriority.HIGH, "Work", LocalDate.now()));
        assertThat(taskRepository.findByIdAndUserId(matching.getId(), owner.getId())).contains(matching);
        assertThat(taskRepository.findByIdAndUserId(matching.getId(), other.getId())).isEmpty();
        assertThat(taskRepository.findFiltered(owner.getId(), TaskStatus.DONE, TaskPriority.HIGH, "work"))
                .containsExactly(matching);
    }
}
