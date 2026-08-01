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
    void findsOnlyTasksOwnedByTheCurrentUser() {
        User owner = userRepository.saveAndFlush(new User("owner@example.com", "hash"));
        User other = userRepository.saveAndFlush(new User("other@example.com", "hash"));
        Task ownerTask = taskRepository.saveAndFlush(new Task(owner, "Owner task", null,
                TaskStatus.TODO, TaskPriority.LOW, "Work", LocalDate.now()));
        taskRepository.saveAndFlush(new Task(other, "Other task", null,
                TaskStatus.TODO, TaskPriority.LOW, "Work", LocalDate.now()));

        assertThat(taskRepository.findFiltered(owner.getId(), null, null, null))
                .containsExactly(ownerTask);
    }

    @Test
    void filtersByStatusPriorityAndCaseInsensitiveCategory() {
        User owner = userRepository.saveAndFlush(new User("owner@example.com", "hash"));
        Task matching = taskRepository.saveAndFlush(new Task(owner, "Matching", null,
                TaskStatus.DONE, TaskPriority.HIGH, "Work", LocalDate.now()));
        taskRepository.saveAndFlush(new Task(owner, "Other status", null,
                TaskStatus.TODO, TaskPriority.HIGH, "Work", LocalDate.now()));
        taskRepository.saveAndFlush(new Task(owner, "Other priority", null,
                TaskStatus.DONE, TaskPriority.LOW, "Work", LocalDate.now()));
        taskRepository.saveAndFlush(new Task(owner, "Other category", null,
                TaskStatus.DONE, TaskPriority.HIGH, "Home", LocalDate.now()));

        assertThat(taskRepository.findFiltered(owner.getId(), TaskStatus.DONE, TaskPriority.HIGH, "work"))
                .containsExactly(matching);
    }

    @Test
    void omitsAbsentFiltersAndOrdersNewestFirst() {
        User owner = userRepository.saveAndFlush(new User("owner@example.com", "hash"));
        Task oldest = taskRepository.saveAndFlush(new Task(owner, "Oldest", null,
                TaskStatus.TODO, TaskPriority.LOW, "Work", LocalDate.now()));
        Task middle = taskRepository.saveAndFlush(new Task(owner, "Middle", null,
                TaskStatus.IN_PROGRESS, TaskPriority.MEDIUM, "Home", LocalDate.now()));
        Task newest = taskRepository.saveAndFlush(new Task(owner, "Newest", null,
                TaskStatus.DONE, TaskPriority.HIGH, "Study", LocalDate.now()));

        assertThat(taskRepository.findFiltered(owner.getId(), null, null, null))
                .extracting(Task::getId)
                .containsExactly(newest.getId(), middle.getId(), oldest.getId());
    }

    @Test
    void findByIdAndUserIdHidesAnotherUsersTask() {
        User owner = userRepository.saveAndFlush(new User("owner@example.com", "hash"));
        User other = userRepository.saveAndFlush(new User("other@example.com", "hash"));
        Task task = taskRepository.saveAndFlush(new Task(owner, "Private task", null,
                TaskStatus.TODO, TaskPriority.MEDIUM, "Personal", LocalDate.now()));

        assertThat(taskRepository.findByIdAndUserId(task.getId(), owner.getId())).contains(task);
        assertThat(taskRepository.findByIdAndUserId(task.getId(), other.getId())).isEmpty();
    }
}
