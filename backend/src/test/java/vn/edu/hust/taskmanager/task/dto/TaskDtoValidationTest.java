package vn.edu.hust.taskmanager.task.dto;

import vn.edu.hust.taskmanager.task.model.TaskPriority;
import vn.edu.hust.taskmanager.task.model.TaskStatus;

import jakarta.validation.ConstraintViolation;
import jakarta.validation.Validation;
import jakarta.validation.Validator;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;

import java.time.LocalDate;
import java.util.Set;
import java.util.stream.Collectors;

import static org.assertj.core.api.Assertions.assertThat;

class TaskDtoValidationTest {

    private static Validator validator;

    @BeforeAll
    static void createValidator() {
        validator = Validation.buildDefaultValidatorFactory().getValidator();
    }

    @Test
    void acceptsValidTaskIncludingPastDueDateAndOptionalDescription() {
        TaskRequest request = new TaskRequest(
                "  Finish report  ", "Details", TaskStatus.TODO,
                TaskPriority.HIGH, " WORK ", LocalDate.now().minusDays(1));

        assertThat(validator.validate(request)).isEmpty();
    }

    @Test
    void rejectsMissingRequiredFields() {
        TaskRequest request = new TaskRequest(null, null, null, null, " ", null);

        assertThat(violationPaths(request))
                .containsExactlyInAnyOrder("title", "status", "priority", "category");
    }

    @Test
    void rejectsOversizedFields() {
        TaskRequest request = new TaskRequest(
                "t".repeat(121), "d".repeat(501), TaskStatus.TODO,
                TaskPriority.LOW, "c".repeat(51), null);

        assertThat(violationPaths(request))
                .containsExactlyInAnyOrder("title", "description", "category");
    }

    @Test
    void rejectsVietnameseCategoryLabelsAndAcceptsStableCodes() {
        TaskRequest legacy = new TaskRequest(
                "Title", null, TaskStatus.TODO, TaskPriority.MEDIUM, "Học tập", null);
        TaskRequest code = new TaskRequest(
                "Title", null, TaskStatus.TODO, TaskPriority.MEDIUM, "STUDY", null);

        assertThat(violationPaths(legacy)).contains("category");
        assertThat(violationPaths(code)).doesNotContain("category");
    }

    @Test
    void responseAndRequestDoNotExposeOwnerId() {
        assertThat(java.util.Arrays.stream(TaskResponse.class.getRecordComponents())
                .map(component -> component.getName())
                .toList())
                .doesNotContain("userId");
    }

    @Test
    void exposesAllSupportedStatusAndPriorityValues() {
        assertThat(TaskStatus.values()).containsExactly(TaskStatus.TODO, TaskStatus.IN_PROGRESS, TaskStatus.DONE);
        assertThat(TaskPriority.values()).containsExactly(TaskPriority.LOW, TaskPriority.MEDIUM, TaskPriority.HIGH);
    }

    private Set<String> violationPaths(TaskRequest request) {
        return validator.validate(request).stream()
                .map(ConstraintViolation::getPropertyPath)
                .map(Object::toString)
                .collect(Collectors.toSet());
    }
}
