package vn.edu.hust.taskmanager.task;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;
import vn.edu.hust.taskmanager.auth.User;
import vn.edu.hust.taskmanager.auth.UserRepository;
import vn.edu.hust.taskmanager.common.TaskNotFoundException;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class TaskServiceTest {
    @Mock TaskRepository taskRepository;
    @Mock UserRepository userRepository;
    private TaskService service;

    @BeforeEach void setUp() { service = new TaskService(taskRepository, userRepository); }

    @Test
    void listsUsingAuthenticatedOwnerAndNormalizedOptionalCategory() {
        when(taskRepository.findFiltered(42L, TaskStatus.TODO, TaskPriority.HIGH, "Work"))
                .thenReturn(List.of(task(7L, user(42L), "Title", "Work")));
        assertThat(service.list(42L, TaskStatus.TODO, TaskPriority.HIGH, "  Work "))
                .extracting(TaskResponse::id).containsExactly(7L);
        verify(taskRepository).findFiltered(42L, TaskStatus.TODO, TaskPriority.HIGH, "Work");
    }

    @Test
    void hidesMissingOrCrossUserTaskAsTaskNotFound() {
        when(taskRepository.findByIdAndUserId(7L, 42L)).thenReturn(Optional.empty());
        assertThatThrownBy(() -> service.get(42L, 7L)).isInstanceOf(TaskNotFoundException.class);
    }

    @Test
    void createsAndNormalizesTitleCategoryAndBlankDescription() {
        User owner = user(42L);
        when(userRepository.findById(42L)).thenReturn(Optional.of(owner));
        when(taskRepository.save(any(Task.class))).thenAnswer(invocation -> {
            Task saved = invocation.getArgument(0);
            ReflectionTestUtils.setField(saved, "id", 8L);
            return saved;
        });
        TaskResponse response = service.create(42L, new TaskRequest("  title ", "  ", TaskStatus.TODO,
                TaskPriority.LOW, " cat ", LocalDate.now().minusDays(1)));
        assertThat(response.id()).isEqualTo(8L);
        assertThat(response.title()).isEqualTo("title");
        assertThat(response.category()).isEqualTo("cat");
        assertThat(response.description()).isNull();
    }

    @Test
    void updatesOnlyOwnedTaskAndDeletesIt() {
        Task existing = task(7L, user(42L), "Old", "Work");
        when(taskRepository.findByIdAndUserId(7L, 42L)).thenReturn(Optional.of(existing));
        when(taskRepository.save(existing)).thenReturn(existing);

        TaskResponse updated = service.update(42L, 7L,
                new TaskRequest(" New ", " details ", TaskStatus.IN_PROGRESS,
                        TaskPriority.MEDIUM, " Home ", LocalDate.now().minusDays(2)));

        assertThat(updated.title()).isEqualTo("New");
        assertThat(updated.status()).isEqualTo(TaskStatus.IN_PROGRESS);
        assertThat(updated.priority()).isEqualTo(TaskPriority.MEDIUM);
        assertThat(updated.category()).isEqualTo("Home");

        service.delete(42L, 7L);
        verify(taskRepository).delete(existing);
    }

    @Test
    void patchesStatusAndPinOnlyOnOwnedTask() {
        Task existing = task(7L, user(42L), "Old", "Work");
        when(taskRepository.findByIdAndUserId(7L, 42L)).thenReturn(Optional.of(existing));
        when(taskRepository.save(existing)).thenReturn(existing);

        TaskResponse statusResponse = service.updateStatus(42L, 7L, TaskStatus.DONE);
        TaskResponse pinResponse = service.updatePinned(42L, 7L, true);

        assertThat(statusResponse.status()).isEqualTo(TaskStatus.DONE);
        assertThat(pinResponse.pinned()).isTrue();
        assertThat(existing.getTitle()).isEqualTo("Old");
        assertThat(existing.getCategory()).isEqualTo("Work");
    }

    @Test
    void rejectsStatusAndPinPatchesForAnotherUsersTask() {
        when(taskRepository.findByIdAndUserId(7L, 42L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.updateStatus(42L, 7L, TaskStatus.DONE))
                .isInstanceOf(TaskNotFoundException.class);
        assertThatThrownBy(() -> service.updatePinned(42L, 7L, true))
                .isInstanceOf(TaskNotFoundException.class);
    }

    private User user(Long id) { User user = new User("owner" + id + "@example.com", "hash"); ReflectionTestUtils.setField(user, "id", id); return user; }
    private Task task(Long id, User user, String title, String category) {
        Task task = new Task(user, title, "Description", TaskStatus.TODO, TaskPriority.HIGH, category, LocalDate.now());
        ReflectionTestUtils.setField(task, "id", id);
        return task;
    }
}
