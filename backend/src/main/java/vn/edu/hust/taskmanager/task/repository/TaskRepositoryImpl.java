package vn.edu.hust.taskmanager.task.repository;

import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import jakarta.persistence.criteria.CriteriaBuilder;
import jakarta.persistence.criteria.CriteriaQuery;
import jakarta.persistence.criteria.Predicate;
import jakarta.persistence.criteria.Root;
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
    public List<Task> findFiltered(Long userId, TaskStatus status, TaskPriority priority, String category) {
        CriteriaBuilder builder = entityManager.getCriteriaBuilder();
        CriteriaQuery<Task> query = builder.createQuery(Task.class);
        Root<Task> task = query.from(Task.class);
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
        query.where(builder.and(filters.toArray(new Predicate[0])))
                .orderBy(builder.desc(task.get("createdAt")), builder.desc(task.get("id")));
        return entityManager.createQuery(query).getResultList();
    }
}
