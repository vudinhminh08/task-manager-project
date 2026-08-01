package vn.edu.hust.expensetracker.transaction;

import java.time.LocalDate;
import java.util.List;

public interface TransactionRepositoryCustom {

    /**
     * Returns the current user's transactions, newest first, narrowed by any
     * filter that is not null.
     */
    List<Transaction> findFiltered(
            Long userId,
            TransactionType type,
            String category,
            LocalDate fromDate,
            LocalDate toDate);
}
