package vn.edu.hust.taskmanager.auth.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import vn.edu.hust.taskmanager.auth.validation.Utf8ByteLength;

public record RegisterRequest(
        @NotBlank @Email @Size(max = 254) String email,
        @NotBlank @Size(min = 8) @Utf8ByteLength(max = 72) String password,
        @Size(max = 100) String fullName,
        @Size(max = 30) String phone) {

    public RegisterRequest(String email, String password) {
        this(email, password, null, null);
    }

    public RegisterRequest(String email, String password, String phone) {
        this(email, password, null, phone);
    }

    /**
     * Trims the email here so validation sees the same value the service will
     * normalize. Without it a client sending surrounding whitespace fails
     * {@code @Email} instead of being accepted as the contract documents.
     */
    public RegisterRequest {
        email = email == null ? null : email.trim();
        fullName = fullName == null || fullName.isBlank() ? "" : fullName.trim();
        phone = phone == null || phone.isBlank() ? null : phone.trim();
    }

    @Override
    public String toString() {
        return "RegisterRequest[email=" + email + ", password=[REDACTED]]";
    }
}
