package vn.edu.hust.expensetracker.transaction;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;
import vn.edu.hust.expensetracker.auth.User;
import vn.edu.hust.expensetracker.auth.UserRepository;
import vn.edu.hust.expensetracker.common.TransactionNotFoundException;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class TransactionServiceTest {

    @Mock
    private TransactionRepository transactionRepository;

    @Mock
    private UserRepository userRepository;

    private TransactionService transactionService;

    @BeforeEach
    void setUp() {
        transactionService = new TransactionService(transactionRepository, userRepository);
    }

    @Test
    void listsOnlyCurrentUsersMatchingTransactionsForMonthInRepositoryOrder() {
        User owner = user(42L);
        Transaction newest = transaction(
                12L, owner, TransactionType.EXPENSE, "200000.00", "Ăn uống",
                LocalDate.of(2026, 7, 31));
        Transaction older = transaction(
                11L, owner, TransactionType.EXPENSE, "100000.00", "Ăn uống",
                LocalDate.of(2026, 7, 1));
        when(transactionRepository.findFiltered(
                42L,
                TransactionType.EXPENSE,
                "Ăn uống",
                LocalDate.of(2026, 7, 1),
                LocalDate.of(2026, 7, 31)))
                .thenReturn(List.of(newest, older));

        List<TransactionResponse> result = transactionService.list(
                42L, TransactionType.EXPENSE, "  Ăn uống  ", "2026-07");

        assertThat(result).extracting(TransactionResponse::id)
                .containsExactly(12L, 11L);
    }

    @Test
    void listTreatsBlankOptionalFiltersAsAbsent() {
        when(transactionRepository.findFiltered(42L, null, null, null, null))
                .thenReturn(List.of());

        assertThat(transactionService.list(42L, null, " ", " ")).isEmpty();

        verify(transactionRepository).findFiltered(42L, null, null, null, null);
    }

    @Test
    void listRejectsMonthOutsideYearMonthFormat() {
        assertThatThrownBy(() ->
                transactionService.list(42L, null, null, "2026-7"))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage("Tháng phải có định dạng YYYY-MM");

        verify(transactionRepository, never())
                .findFiltered(any(), any(), any(), any(), any());
    }

    @Test
    void getsTransactionThroughOwnerScopedLookup() {
        Transaction transaction = transaction(
                9L, user(42L), TransactionType.INCOME, "500000.00", "Lương",
                LocalDate.of(2026, 7, 30));
        when(transactionRepository.findByIdAndUserId(9L, 42L))
                .thenReturn(Optional.of(transaction));

        TransactionResponse response = transactionService.get(42L, 9L);

        assertThat(response.id()).isEqualTo(9L);
        assertThat(response.type()).isEqualTo(TransactionType.INCOME);
        assertThat(response.category()).isEqualTo("Lương");
    }

    @Test
    void hidesWhetherMissingTransactionBelongsToAnotherUser() {
        when(transactionRepository.findByIdAndUserId(9L, 42L))
                .thenReturn(Optional.empty());

        assertThatThrownBy(() -> transactionService.get(42L, 9L))
                .isInstanceOf(TransactionNotFoundException.class)
                .hasMessage("Không tìm thấy giao dịch");
    }

    @Test
    void createsTransactionForCurrentUserAndNormalizesText() {
        User owner = user(42L);
        when(userRepository.findById(42L)).thenReturn(Optional.of(owner));
        when(transactionRepository.save(any(Transaction.class))).thenAnswer(invocation -> {
            Transaction saved = invocation.getArgument(0);
            ReflectionTestUtils.setField(saved, "id", 15L);
            return saved;
        });

        TransactionResponse response = transactionService.create(
                42L,
                request("125000.00", "  Ăn uống  ", "   "));

        assertThat(response.id()).isEqualTo(15L);
        verify(transactionRepository).save(org.mockito.ArgumentMatchers.argThat(transaction ->
                transaction.getUser() == owner
                        && transaction.getCategory().equals("Ăn uống")
                        && transaction.getDescription() == null));
    }

    @Test
    void updatesOnlyOwnerScopedTransactionAndNormalizesText() {
        Transaction transaction = transaction(
                9L, user(42L), TransactionType.EXPENSE, "100000.00", "Khác",
                LocalDate.of(2026, 7, 1));
        when(transactionRepository.findByIdAndUserId(9L, 42L))
                .thenReturn(Optional.of(transaction));
        when(transactionRepository.save(transaction)).thenReturn(transaction);

        TransactionResponse response = transactionService.update(
                42L,
                9L,
                new TransactionRequest(
                        TransactionType.INCOME,
                        new BigDecimal("250000.00"),
                        "  Lương  ",
                        "  Tháng 7  ",
                        LocalDate.of(2026, 7, 31)));

        assertThat(response.type()).isEqualTo(TransactionType.INCOME);
        assertThat(response.amount()).isEqualByComparingTo("250000.00");
        assertThat(response.category()).isEqualTo("Lương");
        assertThat(response.description()).isEqualTo("Tháng 7");
        verify(transactionRepository).save(transaction);
    }

    @Test
    void deletesOnlyOwnerScopedTransaction() {
        Transaction transaction = transaction(
                9L, user(42L), TransactionType.EXPENSE, "100000.00", "Khác",
                LocalDate.of(2026, 7, 1));
        when(transactionRepository.findByIdAndUserId(9L, 42L))
                .thenReturn(Optional.of(transaction));

        transactionService.delete(42L, 9L);

        verify(transactionRepository).delete(transaction);
    }

    private TransactionRequest request(String amount, String category, String description) {
        return new TransactionRequest(
                TransactionType.EXPENSE,
                new BigDecimal(amount),
                category,
                description,
                LocalDate.of(2026, 7, 31));
    }

    private User user(Long id) {
        User user = new User("owner@example.com", "hash");
        ReflectionTestUtils.setField(user, "id", id);
        return user;
    }

    private Transaction transaction(
            Long id,
            User user,
            TransactionType type,
            String amount,
            String category,
            LocalDate date) {
        Transaction transaction = new Transaction(
                user,
                type,
                new BigDecimal(amount),
                category,
                "Mô tả",
                date);
        ReflectionTestUtils.setField(transaction, "id", id);
        ReflectionTestUtils.setField(transaction, "createdAt", Instant.parse("2026-07-01T00:00:00Z"));
        ReflectionTestUtils.setField(transaction, "updatedAt", Instant.parse("2026-07-02T00:00:00Z"));
        return transaction;
    }
}
