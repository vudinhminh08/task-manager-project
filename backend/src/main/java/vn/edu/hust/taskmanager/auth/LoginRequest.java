package vn.edu.hust.taskmanager.auth;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record LoginRequest(
        @NotBlank @Email @Size(max = 254) String email,
        @NotBlank @Size(min = 8) @Utf8ByteLength(max = 72) String password) {

    /**
     * Trims the email here so validation sees the same value the service will
     * normalize. Without it a client sending surrounding whitespace fails
     * {@code @Email} instead of being accepted as the contract documents.
     */
    public LoginRequest {
        email = email == null ? null : email.trim();
    }

    @Override
    public String toString() {
        return "LoginRequest[email=" + email + ", password=[REDACTED]]";
    }
}
