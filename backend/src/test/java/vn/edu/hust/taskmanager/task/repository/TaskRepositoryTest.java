package vn.edu.hust.taskmanager.task.repository;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.data.jpa.test.autoconfigure.DataJpaTest;
import org.springframework.boot.jdbc.test.autoconfigure.AutoConfigureTestDatabase;
import org.springframework.data.domain.PageRequest;
import org.springframework.test.context.ActiveProfiles;
import vn.edu.hust.taskmanager.auth.model.User;
import vn.edu.hust.taskmanager.auth.repository.UserRepository;
import vn.edu.hust.taskmanager.task.model.Task;
import vn.edu.hust.taskmanager.task.model.TaskPriority;
import vn.edu.hust.taskmanager.task.model.TaskStatus;

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
                TaskStatus.TODO, TaskPriority.LOW, "WORK", LocalDate.now()));
        taskRepository.saveAndFlush(new Task(other, "Other task", null,
                TaskStatus.TODO, TaskPriority.LOW, "WORK", LocalDate.now()));

        assertThat(taskRepository.findFiltered(owner.getId(), null, null, null, PageRequest.of(0, 10)).getContent())
                .containsExactly(ownerTask);
    }

    @Test
    void filtersByStatusPriorityAndCaseInsensitiveCategory() {
        User owner = userRepository.saveAndFlush(new User("owner@example.com", "hash"));
        Task matching = taskRepository.saveAndFlush(new Task(owner, "Matching", null,
                TaskStatus.DONE, TaskPriority.HIGH, "WORK", LocalDate.now()));
        taskRepository.saveAndFlush(new Task(owner, "Other status", null,
                TaskStatus.TODO, TaskPriority.HIGH, "WORK", LocalDate.now()));
        taskRepository.saveAndFlush(new Task(owner, "Other priority", null,
                TaskStatus.DONE, TaskPriority.LOW, "WORK", LocalDate.now()));
        taskRepository.saveAndFlush(new Task(owner, "Other category", null,
                TaskStatus.DONE, TaskPriority.HIGH, "HOME", LocalDate.now()));

        assertThat(taskRepository.findFiltered(owner.getId(), TaskStatus.DONE, TaskPriority.HIGH, "work", PageRequest.of(0, 10)).getContent())
                .containsExactly(matching);
    }

    @Test
    void omitsAbsentFiltersAndOrdersNewestFirst() {
        User owner = userRepository.saveAndFlush(new User("owner@example.com", "hash"));
        Task oldest = taskRepository.saveAndFlush(new Task(owner, "Oldest", null,
                TaskStatus.TODO, TaskPriority.LOW, "WORK", LocalDate.now()));
        Task middle = taskRepository.saveAndFlush(new Task(owner, "Middle", null,
                TaskStatus.IN_PROGRESS, TaskPriority.MEDIUM, "HOME", LocalDate.now()));
        Task newest = taskRepository.saveAndFlush(new Task(owner, "Newest", null,
                TaskStatus.DONE, TaskPriority.HIGH, "STUDY", LocalDate.now()));

        assertThat(taskRepository.findFiltered(owner.getId(), null, null, null, PageRequest.of(0, 10)).getContent())
                .extracting(Task::getId)
                .containsExactly(newest.getId(), middle.getId(), oldest.getId());
    }

    @Test
    void returnsRequestedPageAndTotalMetadata() {
        User owner = userRepository.saveAndFlush(new User("owner@example.com", "hash"));
        Task oldest = taskRepository.saveAndFlush(new Task(owner, "Oldest", null,
                TaskStatus.TODO, TaskPriority.LOW, "WORK", LocalDate.now()));
        Task middle = taskRepository.saveAndFlush(new Task(owner, "Middle", null,
                TaskStatus.TODO, TaskPriority.LOW, "WORK", LocalDate.now()));
        Task newest = taskRepository.saveAndFlush(new Task(owner, "Newest", null,
                TaskStatus.TODO, TaskPriority.LOW, "WORK", LocalDate.now()));

        var firstPage = taskRepository.findFiltered(owner.getId(), null, null, null, PageRequest.of(0, 2));
        var secondPage = taskRepository.findFiltered(owner.getId(), null, null, null, PageRequest.of(1, 2));

        assertThat(firstPage.getContent()).extracting(Task::getId)
                .containsExactly(newest.getId(), middle.getId());
        assertThat(secondPage.getContent()).extracting(Task::getId)
                .containsExactly(oldest.getId());
        assertThat(firstPage.getTotalElements()).isEqualTo(3);
        assertThat(firstPage.getTotalPages()).isEqualTo(2);
    }

    @Test
    void findByIdAndUserIdHidesAnotherUsersTask() {
        User owner = userRepository.saveAndFlush(new User("owner@example.com", "hash"));
        User other = userRepository.saveAndFlush(new User("other@example.com", "hash"));
        Task task = taskRepository.saveAndFlush(new Task(owner, "Private task", null,
                TaskStatus.TODO, TaskPriority.MEDIUM, "PERSONAL", LocalDate.now()));

        assertThat(taskRepository.findByIdAndUserId(task.getId(), owner.getId())).contains(task);
        assertThat(taskRepository.findByIdAndUserId(task.getId(), other.getId())).isEmpty();
    }
}
