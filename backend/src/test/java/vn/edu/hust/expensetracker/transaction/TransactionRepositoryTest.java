package vn.edu.hust.expensetracker.transaction;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.data.jpa.test.autoconfigure.DataJpaTest;
import org.springframework.boot.jdbc.test.autoconfigure.AutoConfigureTestDatabase;
import org.springframework.test.context.ActiveProfiles;
import vn.edu.hust.expensetracker.auth.User;
import vn.edu.hust.expensetracker.auth.UserRepository;

import javax.sql.DataSource;
import java.math.BigDecimal;
import java.sql.SQLException;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.boot.jdbc.test.autoconfigure.AutoConfigureTestDatabase.Replace.NONE;

@DataJpaTest
@AutoConfigureTestDatabase(replace = NONE)
@ActiveProfiles("test")
class TransactionRepositoryTest {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private TransactionRepository transactionRepository;

    @Autowired
    private DataSource dataSource;

    @Test
    void usesDatasourceConfiguredByTestProfile() throws SQLException {
        try (var connection = dataSource.getConnection()) {
            assertThat(connection.getMetaData().getURL())
                    .isEqualTo("jdbc:h2:mem:expense_test");
        }
    }

    @Test
    void findsTransactionOnlyForItsOwner() {
        User owner = userRepository.save(new User("owner@example.com", "hash"));
        User other = userRepository.save(new User("other@example.com", "hash"));
        Transaction saved = saveTransaction(
                owner,
                TransactionType.EXPENSE,
                "125000.00",
                "Ăn uống",
                LocalDate.of(2026, 7, 31));

        assertThat(transactionRepository.findByIdAndUserId(saved.getId(), owner.getId()))
                .contains(saved);
        assertThat(transactionRepository.findByIdAndUserId(saved.getId(), other.getId()))
                .isEmpty();
    }

    @Test
    void updatesTimestampImmediatelyWithoutChangingCreationTimestamp() {
        User owner = userRepository.save(new User("owner@example.com", "hash"));
        Transaction saved = saveTransaction(
                owner,
                TransactionType.EXPENSE,
                "125000.00",
                "Ăn uống",
                LocalDate.of(2026, 7, 31));
        transactionRepository.flush();
        Instant createdAt = saved.getCreatedAt();
        Instant beforeUpdate = Instant.now();

        saved.update(
                TransactionType.INCOME,
                new BigDecimal("250000.00"),
                "Lương",
                "Điều chỉnh",
                LocalDate.of(2026, 8, 1));

        assertThat(saved.getCreatedAt()).isEqualTo(createdAt);
        assertThat(saved.getUpdatedAt()).isAfterOrEqualTo(beforeUpdate);
    }

    @Test
    void listsOnlyTheUsersTransactionsInDateAndIdDescendingOrder() {
        User owner = userRepository.save(new User("owner@example.com", "hash"));
        User other = userRepository.save(new User("other@example.com", "hash"));
        Transaction older = saveTransaction(
                owner,
                TransactionType.INCOME,
                "500000.00",
                "Lương",
                LocalDate.of(2026, 7, 30));
        Transaction sameDayFirst = saveTransaction(
                owner,
                TransactionType.EXPENSE,
                "100000.00",
                "Ăn uống",
                LocalDate.of(2026, 7, 31));
        Transaction sameDaySecond = saveTransaction(
                owner,
                TransactionType.EXPENSE,
                "200000.00",
                "Di chuyển",
                LocalDate.of(2026, 7, 31));
        saveTransaction(
                other,
                TransactionType.EXPENSE,
                "300000.00",
                "Ăn uống",
                LocalDate.of(2026, 8, 1));

        List<Transaction> result = transactionRepository.findFiltered(
                owner.getId(), null, null, null, null);

        assertThat(result).containsExactly(sameDaySecond, sameDayFirst, older);
    }

    @Test
    void appliesAllOptionalFiltersWithInclusiveDateBoundaries() {
        User owner = userRepository.save(new User("owner@example.com", "hash"));
        Transaction matchingFromDate = saveTransaction(
                owner,
                TransactionType.EXPENSE,
                "100000.00",
                "Ăn Uống",
                LocalDate.of(2026, 7, 30));
        Transaction matchingMiddle = saveTransaction(
                owner,
                TransactionType.EXPENSE,
                "125000.00",
                "Ăn Uống",
                LocalDate.of(2026, 7, 31));
        Transaction matchingToDate = saveTransaction(
                owner,
                TransactionType.EXPENSE,
                "150000.00",
                "Ăn Uống",
                LocalDate.of(2026, 8, 1));
        saveTransaction(
                owner,
                TransactionType.INCOME,
                "125000.00",
                "Ăn Uống",
                LocalDate.of(2026, 7, 31));
        saveTransaction(
                owner,
                TransactionType.EXPENSE,
                "125000.00",
                "Di chuyển",
                LocalDate.of(2026, 7, 31));
        saveTransaction(
                owner,
                TransactionType.EXPENSE,
                "125000.00",
                "Ăn Uống",
                LocalDate.of(2026, 7, 29));
        saveTransaction(
                owner,
                TransactionType.EXPENSE,
                "125000.00",
                "Ăn Uống",
                LocalDate.of(2026, 8, 2));

        List<Transaction> result = transactionRepository.findFiltered(
                owner.getId(),
                TransactionType.EXPENSE,
                "ăn uống",
                LocalDate.of(2026, 7, 30),
                LocalDate.of(2026, 8, 1));

        assertThat(result)
                .containsExactly(matchingToDate, matchingMiddle, matchingFromDate);
    }

    private Transaction saveTransaction(
            User user,
            TransactionType type,
            String amount,
            String category,
            LocalDate transactionDate) {
        return transactionRepository.save(new Transaction(
                user,
                type,
                new BigDecimal(amount),
                category,
                "Mô tả",
                transactionDate));
    }
}
