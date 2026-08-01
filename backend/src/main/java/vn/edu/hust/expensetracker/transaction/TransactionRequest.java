package vn.edu.hust.expensetracker.transaction;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PastOrPresent;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.time.LocalDate;

public record TransactionRequest(
        @NotNull
        TransactionType type,

        @NotNull
        @DecimalMin("0.01")
        @DecimalMax("9999999999999.99")
        @Digits(integer = 13, fraction = 2)
        BigDecimal amount,

        @NotBlank
        @Size(max = 50)
        String category,

        @Size(max = 255)
        String description,

        @NotNull
        @PastOrPresent
        LocalDate transactionDate) {
}
