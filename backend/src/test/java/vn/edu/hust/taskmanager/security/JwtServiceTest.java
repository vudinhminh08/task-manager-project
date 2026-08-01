package vn.edu.hust.taskmanager.security;

import com.auth0.jwt.JWT;
import com.auth0.jwt.algorithms.Algorithm;
import org.junit.jupiter.api.Test;

import java.time.Duration;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatIllegalArgumentException;

class JwtServiceTest {

    @Test
    void createsHs256TokenWithIssuerLongSubjectAndConfiguredExpiry() {
        JwtService service = new JwtService(
                "test-secret-with-at-least-thirty-two-bytes", 7200);

        String token = service.createToken(42L);
        var decoded = JWT.require(Algorithm.HMAC256(
                        "test-secret-with-at-least-thirty-two-bytes"))
                .withIssuer("task-manager-api")
                .build()
                .verify(token);

        assertThat(decoded.getAlgorithm()).isEqualTo("HS256");
        assertThat(decoded.getIssuer()).isEqualTo("task-manager-api");
        assertThat(decoded.getSubject()).isEqualTo("42");
        assertThat(Duration.between(
                decoded.getIssuedAtAsInstant(),
                decoded.getExpiresAtAsInstant()).getSeconds()).isEqualTo(7200);
        assertThat(service.verifyAndGetUserId(token)).isEqualTo(42L);
        assertThat(service.expirationSeconds()).isEqualTo(7200);
    }

    @Test
    void rejectsSecretShorterThanThirtyTwoUtf8Bytes() {
        assertThatIllegalArgumentException()
                .isThrownBy(() -> new JwtService("x".repeat(31), 7200))
                .withMessage("JWT secret must be at least 32 UTF-8 bytes");
        assertThatIllegalArgumentException()
                .isThrownBy(() -> new JwtService("é".repeat(15), 7200))
                .withMessage("JWT secret must be at least 32 UTF-8 bytes");
    }

    @Test
    void acceptsThirtyTwoByteMultibyteSecret() {
        JwtService service = new JwtService("é".repeat(16), 7200);

        assertThat(service.verifyAndGetUserId(service.createToken(42L)))
                .isEqualTo(42L);
    }

    @Test
    void rejectsNonPositiveExpiration() {
        String secret = "test-secret-with-at-least-thirty-two-bytes";

        assertThatIllegalArgumentException()
                .isThrownBy(() -> new JwtService(secret, 0))
                .withMessage("JWT expiration seconds must be positive");
        assertThatIllegalArgumentException()
                .isThrownBy(() -> new JwtService(secret, -1))
                .withMessage("JWT expiration seconds must be positive");
    }
}
