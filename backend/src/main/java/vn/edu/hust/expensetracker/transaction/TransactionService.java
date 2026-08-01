package vn.edu.hust.expensetracker.transaction;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import vn.edu.hust.expensetracker.auth.User;
import vn.edu.hust.expensetracker.auth.UserRepository;
import vn.edu.hust.expensetracker.common.InvalidCredentialsException;
import vn.edu.hust.expensetracker.common.InvalidMonthFilterException;
import vn.edu.hust.expensetracker.common.TransactionNotFoundException;

import java.time.LocalDate;
import java.time.YearMonth;
import java.time.format.DateTimeParseException;
import java.util.List;

@Service
public class TransactionService {

    private final TransactionRepository transactionRepository;
    private final UserRepository userRepository;

    public TransactionService(
            TransactionRepository transactionRepository,
            UserRepository userRepository) {
        this.transactionRepository = transactionRepository;
        this.userRepository = userRepository;
    }

    @Transactional(readOnly = true)
    public List<TransactionResponse> list(
            Long userId,
            TransactionType type,
            String category,
            String month) {
        LocalDate fromDate = null;
        LocalDate toDate = null;
        if (month != null && !month.isBlank()) {
            YearMonth yearMonth = parseMonth(month);
            fromDate = yearMonth.atDay(1);
            toDate = yearMonth.atEndOfMonth();
        }

        return transactionRepository.findFiltered(
                        userId,
                        type,
                        normalizeOptional(category),
                        fromDate,
                        toDate)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public TransactionResponse get(Long userId, Long transactionId) {
        return toResponse(findOwned(transactionId, userId));
    }

    @Transactional
    public TransactionResponse create(Long userId, TransactionRequest request) {
        User owner = userRepository.findById(userId)
                .orElseThrow(InvalidCredentialsException::new);
        Transaction transaction = new Transaction(
                owner,
                request.type(),
                request.amount(),
                request.category().trim(),
                normalizeDescription(request.description()),
                request.transactionDate());
        return toResponse(transactionRepository.save(transaction));
    }

    @Transactional
    public TransactionResponse update(
            Long userId,
            Long transactionId,
            TransactionRequest request) {
        Transaction transaction = findOwned(transactionId, userId);
        transaction.update(
                request.type(),
                request.amount(),
                request.category().trim(),
                normalizeDescription(request.description()),
                request.transactionDate());
        return toResponse(transactionRepository.save(transaction));
    }

    @Transactional
    public void delete(Long userId, Long transactionId) {
        transactionRepository.delete(findOwned(transactionId, userId));
    }

    private Transaction findOwned(Long transactionId, Long userId) {
        return transactionRepository.findByIdAndUserId(transactionId, userId)
                .orElseThrow(TransactionNotFoundException::new);
    }

    private YearMonth parseMonth(String month) {
        try {
            return YearMonth.parse(month);
        } catch (DateTimeParseException exception) {
            throw new InvalidMonthFilterException(exception);
        }
    }

    private String normalizeOptional(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }

    private String normalizeDescription(String description) {
        return normalizeOptional(description);
    }

    private TransactionResponse toResponse(Transaction transaction) {
        return new TransactionResponse(
                transaction.getId(),
                transaction.getType(),
                transaction.getAmount(),
                transaction.getCategory(),
                transaction.getDescription(),
                transaction.getTransactionDate(),
                transaction.getCreatedAt(),
                transaction.getUpdatedAt());
    }
}
