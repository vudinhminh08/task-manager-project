package vn.edu.hust.expensetracker.transaction;

import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import jakarta.persistence.criteria.CriteriaBuilder;
import jakarta.persistence.criteria.CriteriaQuery;
import jakarta.persistence.criteria.Predicate;
import jakarta.persistence.criteria.Root;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;

/**
 * Builds the filter query from only the parameters that are present.
 *
 * <p>An earlier JPQL version passed every filter as a bind parameter guarded by
 * {@code :param is null or ...}. PostgreSQL types an untyped null bind as bytea
 * and then rejects the query with "function lower(bytea) does not exist" or
 * "cannot cast type bytea to date". H2 accepts the same query, so the failure
 * only appeared against PostgreSQL. Omitting absent predicates avoids binding
 * nulls at all, and lets the query use the (user_id, transaction_date, id)
 * index without evaluating dead branches.
 */
public class TransactionRepositoryImpl implements TransactionRepositoryCustom {

    @PersistenceContext
    private EntityManager entityManager;

    @Override
    public List<Transaction> findFiltered(
            Long userId,
            TransactionType type,
            String category,
            LocalDate fromDate,
            LocalDate toDate) {
        CriteriaBuilder builder = entityManager.getCriteriaBuilder();
        CriteriaQuery<Transaction> query = builder.createQuery(Transaction.class);
        Root<Transaction> transaction = query.from(Transaction.class);

        List<Predicate> filters = new ArrayList<>();
        filters.add(builder.equal(transaction.get("user").get("id"), userId));
        if (type != null) {
            filters.add(builder.equal(transaction.get("type"), type));
        }
        if (category != null) {
            filters.add(builder.equal(
                    builder.lower(transaction.get("category")),
                    category.toLowerCase(Locale.ROOT)));
        }
        if (fromDate != null) {
            filters.add(builder.greaterThanOrEqualTo(
                    transaction.get("transactionDate"), fromDate));
        }
        if (toDate != null) {
            filters.add(builder.lessThanOrEqualTo(
                    transaction.get("transactionDate"), toDate));
        }

        query.where(builder.and(filters.toArray(new Predicate[0])))
                .orderBy(
                        builder.desc(transaction.get("transactionDate")),
                        builder.desc(transaction.get("id")));

        return entityManager.createQuery(query).getResultList();
    }
}
