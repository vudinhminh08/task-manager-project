package vn.edu.hust.taskmanager.task.repository;

import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import jakarta.persistence.criteria.CriteriaBuilder;
import jakarta.persistence.criteria.CriteriaQuery;
import jakarta.persistence.criteria.Predicate;
import jakarta.persistence.criteria.Root;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import vn.edu.hust.taskmanager.task.model.Task;
import vn.edu.hust.taskmanager.task.model.TaskPriority;
import vn.edu.hust.taskmanager.task.model.TaskStatus;

import java.util.ArrayList;
import java.util.List;
import java.util.Locale;

public class TaskRepositoryImpl implements TaskRepositoryCustom {

    @PersistenceContext
    private EntityManager entityManager;

    @Override
    public Page<Task> findFiltered(Long userId, TaskStatus status, TaskPriority priority, String category,
                                   Pageable pageable) {
        CriteriaBuilder builder = entityManager.getCriteriaBuilder();
        CriteriaQuery<Task> query = builder.createQuery(Task.class);
        Root<Task> task = query.from(Task.class);
        query.where(builder.and(filters(builder, task, userId, status, priority, category)))
                .orderBy(builder.desc(task.get("createdAt")), builder.desc(task.get("id")));

        List<Task> content = entityManager.createQuery(query)
                .setFirstResult(Math.toIntExact(pageable.getOffset()))
                .setMaxResults(pageable.getPageSize())
                .getResultList();

        CriteriaQuery<Long> countQuery = builder.createQuery(Long.class);
        Root<Task> countTask = countQuery.from(Task.class);
        countQuery.select(builder.count(countTask))
                .where(builder.and(filters(builder, countTask, userId, status, priority, category)));
        long total = entityManager.createQuery(countQuery).getSingleResult();
        return new PageImpl<>(content, pageable, total);
    }

    private Predicate[] filters(
            CriteriaBuilder builder,
            Root<Task> task,
            Long userId,
            TaskStatus status,
            TaskPriority priority,
            String category) {
        List<Predicate> filters = new ArrayList<>();
        filters.add(builder.equal(task.get("user").get("id"), userId));
        if (status != null) {
            filters.add(builder.equal(task.get("status"), status));
        }
        if (priority != null) {
            filters.add(builder.equal(task.get("priority"), priority));
        }
        if (category != null) {
            filters.add(builder.equal(builder.lower(task.get("category")), category.toLowerCase(Locale.ROOT)));
        }
        return filters.toArray(new Predicate[0]);
    }
}
