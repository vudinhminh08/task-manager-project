package vn.edu.hust.taskmanager.auth.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import vn.edu.hust.taskmanager.auth.validation.Utf8ByteLength;

public record ProfileUpdateRequest(
        @NotBlank @Size(max = 100) String fullName) {

    public ProfileUpdateRequest {
        fullName = fullName == null ? null : fullName.trim();
    }
}
