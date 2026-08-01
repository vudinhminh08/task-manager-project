package vn.edu.hust.expensetracker.transaction;

import jakarta.validation.ConstraintViolation;
import jakarta.validation.Validation;
import jakarta.validation.Validator;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Arrays;
import java.util.Set;
import java.util.stream.Collectors;

import static org.assertj.core.api.Assertions.assertThat;

class TransactionDtoValidationTest {

    private static Validator validator;

    @BeforeAll
    static void createValidator() {
        validator = Validation.buildDefaultValidatorFactory().getValidator();
    }

    @Test
    void acceptsAmountBoundariesAndPresentDate() {
        assertThat(validator.validate(request("0.01", "Ăn uống", null, LocalDate.now())))
                .isEmpty();
        assertThat(validator.validate(request(
                "9999999999999.99",
                "a".repeat(50),
                "d".repeat(255),
                LocalDate.now().minusDays(1))))
                .isEmpty();
    }

    @Test
    void rejectsMissingRequiredFields() {
        TransactionRequest request = new TransactionRequest(
                null,
                null,
                " ",
                null,
                null);

        assertThat(violationPaths(request))
                .containsExactlyInAnyOrder("type", "amount", "category", "transactionDate");
    }

    @Test
    void rejectsAmountOutsideRangeOrWithMoreThanTwoDecimalPlaces() {
        assertThat(violationPaths(request("0.00", "Ăn uống", null, LocalDate.now())))
                .contains("amount");
        assertThat(violationPaths(request(
                "10000000000000.00", "Ăn uống", null, LocalDate.now())))
                .contains("amount");
        assertThat(violationPaths(request("1.001", "Ăn uống", null, LocalDate.now())))
                .contains("amount");
    }

    @Test
    void rejectsOversizedTextAndFutureDate() {
        TransactionRequest request = request(
                "1.00",
                "c".repeat(51),
                "d".repeat(256),
                LocalDate.now().plusDays(1));

        assertThat(violationPaths(request))
                .containsExactlyInAnyOrder("category", "description", "transactionDate");
    }

    @Test
    void responseDoesNotExposeOwnerId() {
        assertThat(Arrays.stream(TransactionResponse.class.getRecordComponents())
                .map(component -> component.getName())
                .toList())
                .containsExactly(
                        "id",
                        "type",
                        "amount",
                        "category",
                        "description",
                        "transactionDate",
                        "createdAt",
                        "updatedAt")
                .doesNotContain("userId");
    }

    private TransactionRequest request(
            String amount,
            String category,
            String description,
            LocalDate transactionDate) {
        return new TransactionRequest(
                TransactionType.EXPENSE,
                new BigDecimal(amount),
                category,
                description,
                transactionDate);
    }

    private Set<String> violationPaths(TransactionRequest request) {
        return validator.validate(request).stream()
                .map(ConstraintViolation::getPropertyPath)
                .map(Object::toString)
                .collect(Collectors.toSet());
    }
}
