package vn.edu.hust.expensetracker.transaction;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface TransactionRepository
        extends JpaRepository<Transaction, Long>, TransactionRepositoryCustom {

    Optional<Transaction> findByIdAndUserId(Long id, Long userId);
}
