package vn.edu.hust.taskmanager.task.dto;

import vn.edu.hust.taskmanager.task.model.TaskPriority;
import vn.edu.hust.taskmanager.task.model.TaskStatus;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;

public record TaskRequest(
        @NotBlank
        @Size(max = 120)
        String title,

        @Size(max = 500)
        String description,

        @NotNull
        TaskStatus status,

        @NotNull
        TaskPriority priority,

        @NotBlank
        @Size(max = 50)
        @Pattern(regexp = "\\s*(STUDY|WORK|PERSONAL|FAMILY|HEALTH|FINANCE|SHOPPING|PROJECT|PLANNING|HOME|ENTERTAINMENT|OTHER)\\s*")
        String category,

        LocalDate dueDate) {
}
