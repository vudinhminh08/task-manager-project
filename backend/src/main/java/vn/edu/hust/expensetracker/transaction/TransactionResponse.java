package vn.edu.hust.expensetracker.transaction;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;

public record TransactionResponse(
        Long id,
        TransactionType type,
        BigDecimal amount,
        String category,
        String description,
        LocalDate transactionDate,
        Instant createdAt,
        Instant updatedAt) {
}
