package vn.edu.hust.taskmanager.auth.dto;

import jakarta.validation.Validation;
import jakarta.validation.Validator;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class AuthDtoValidationTest {

    private static Validator validator;

    @BeforeAll
    static void createValidator() {
        validator = Validation.buildDefaultValidatorFactory().getValidator();
    }

    @Test
    void registerRequiresValidEmailAndPasswordBetweenEightAndSeventyTwoCharacters() {
        assertThat(validator.validate(
                new RegisterRequest("demo@example.com", "12345678"))).isEmpty();
        assertThat(validator.validate(
                new RegisterRequest("not-an-email", "1234567"))).hasSize(2);
        assertThat(validator.validate(
                new RegisterRequest("demo@example.com", "x".repeat(73)))).hasSize(1);
    }

    @Test
    void loginRequiresValidEmailAndPasswordBetweenEightAndSeventyTwoCharacters() {
        assertThat(validator.validate(
                new LoginRequest("demo@example.com", "12345678"))).isEmpty();
        assertThat(validator.validate(
                new LoginRequest("not-an-email", "1234567"))).hasSize(2);
        assertThat(validator.validate(
                new LoginRequest("demo@example.com", "x".repeat(73)))).hasSize(1);
    }

    @Test
    void trimsSurroundingWhitespaceFromEmailBeforeValidation() {
        RegisterRequest register =
                new RegisterRequest("  demo@example.com  ", "12345678");
        LoginRequest login =
                new LoginRequest("  demo@example.com  ", "12345678");

        assertThat(register.email()).isEqualTo("demo@example.com");
        assertThat(login.email()).isEqualTo("demo@example.com");
        assertThat(validator.validate(register)).isEmpty();
        assertThat(validator.validate(login)).isEmpty();
    }

    @Test
    void keepsNullEmailForTheNotBlankViolation() {
        assertThat(validator.validate(new RegisterRequest(null, "12345678")))
                .extracting(violation -> violation.getPropertyPath().toString())
                .contains("email");
    }

    @Test
    void registerRejectsPasswordLongerThanSeventyTwoUtf8Bytes() {
        String multibytePassword = "é".repeat(37);

        assertThat(multibytePassword).hasSize(37);
        assertThat(validator.validate(
                new RegisterRequest("demo@example.com", multibytePassword)))
                .extracting(violation -> violation.getPropertyPath().toString())
                .contains("password");
    }

    @Test
    void loginRejectsPasswordLongerThanSeventyTwoUtf8Bytes() {
        String multibytePassword = "mậtkhẩu".repeat(7);

        assertThat(multibytePassword).hasSizeLessThanOrEqualTo(72);
        assertThat(validator.validate(
                new LoginRequest("demo@example.com", multibytePassword)))
                .extracting(violation -> violation.getPropertyPath().toString())
                .contains("password");
    }
}
