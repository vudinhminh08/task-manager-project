package vn.edu.hust.taskmanager.auth;

import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class SensitiveRecordToStringTest {

    @Test
    void requestRecordsRedactPlaintextPasswords() {
        String password = "NeverLogThis@2026";

        assertThat(new RegisterRequest("demo@example.com", password).toString())
                .doesNotContain(password)
                .contains("[REDACTED]");
        assertThat(new LoginRequest("demo@example.com", password).toString())
                .doesNotContain(password)
                .contains("[REDACTED]");
    }

    @Test
    void authResponseRedactsAccessToken() {
        String token = "header.payload.signature";

        assertThat(new AuthResponse(
                token,
                "Bearer",
                7200,
                new UserResponse(42L, "demo@example.com")).toString())
                .doesNotContain(token)
                .contains("[REDACTED]");
    }
}
