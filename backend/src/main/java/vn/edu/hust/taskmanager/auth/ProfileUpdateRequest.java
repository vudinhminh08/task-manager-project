package vn.edu.hust.taskmanager.auth;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record ProfileUpdateRequest(
        @NotBlank @Size(max = 100) String fullName) {

    public ProfileUpdateRequest {
        fullName = fullName == null ? null : fullName.trim();
    }
}
