package vn.edu.hust.taskmanager.task;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import vn.edu.hust.taskmanager.auth.User;

import java.time.Instant;
import java.time.LocalDate;

@Entity
@Table(name = "tasks")
public class Task {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(nullable = false, length = 120)
    private String title;

    @Column(length = 500)
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 11)
    private TaskStatus status;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 6)
    private TaskPriority priority;

    @Column(nullable = false, length = 50)
    private String category;

    @Column(name = "due_date")
    private LocalDate dueDate;

    @Column(nullable = false)
    private boolean pinned = false;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    protected Task() {
    }

    public Task(
            User user,
            String title,
            String description,
            TaskStatus status,
            TaskPriority priority,
            String category,
            LocalDate dueDate) {
        this.user = user;
        update(title, description, status, priority, category, dueDate);
    }

    public void update(
            String title,
            String description,
            TaskStatus status,
            TaskPriority priority,
            String category,
            LocalDate dueDate) {
        this.title = title == null ? null : title.trim();
        this.description = description == null || description.isBlank()
                ? null : description.trim();
        this.status = status;
        this.priority = priority;
        this.category = category == null ? null : category.trim();
        this.dueDate = dueDate;
        this.updatedAt = Instant.now();
    }

    public void updateStatus(TaskStatus status) {
        this.status = status;
        this.updatedAt = Instant.now();
    }

    public void updatePinned(boolean pinned) {
        this.pinned = pinned;
        this.updatedAt = Instant.now();
    }

    @PrePersist
    void onCreate() {
        Instant now = Instant.now();
        createdAt = now;
        updatedAt = now;
    }

    public Long getId() { return id; }
    public User getUser() { return user; }
    public String getTitle() { return title; }
    public String getDescription() { return description; }
    public TaskStatus getStatus() { return status; }
    public TaskPriority getPriority() { return priority; }
    public String getCategory() { return category; }
    public LocalDate getDueDate() { return dueDate; }
    public boolean isPinned() { return pinned; }
    public Instant getCreatedAt() { return createdAt; }
    public Instant getUpdatedAt() { return updatedAt; }
}
